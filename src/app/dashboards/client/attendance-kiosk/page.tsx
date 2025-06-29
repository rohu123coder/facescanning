'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Camera, UserCheck, UserX, ShieldAlert, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';

import { type Student, type Staff, type Attendance } from '@/lib/data';
import { recognizeFace } from '@/ai/flows/face-scan-attendance';

type ScanStatusType = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'NO_MATCH' | 'ERROR';
const SCAN_INTERVAL_MS = 3000;
const PERSON_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const KioskUI = ({ personType, status, videoRef, canvasRef, todaysLog, getPersonName, isActive }: {
    personType: 'Student' | 'Staff';
    status: { type: ScanStatusType; message: string };
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    todaysLog: Attendance[];
    getPersonName: (id: string) => string;
    isActive: boolean;
}) => {
    const StatusIcon = useCallback(() => {
        switch (status.type) {
            case 'SCANNING': return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
            case 'SUCCESS': return <UserCheck className="h-6 w-6 text-green-500" />;
            case 'NO_MATCH': return <UserX className="h-6 w-6 text-destructive" />;
            case 'ERROR': return <ShieldAlert className="h-6 w-6 text-destructive" />;
            default: return <Camera className="h-6 w-6 text-muted-foreground" />;
        }
    }, [status.type]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">AI Face Scan</CardTitle>
                    <CardDescription>The system will automatically detect and record {personType.toLowerCase()} attendance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {!isActive && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                                <CameraOff className="h-16 w-16 mb-4" />
                                <h3 className="text-lg font-bold">Kiosk Inactive</h3>
                                <p>This kiosk is currently paused.</p>
                            </div>
                        )}
                        {isActive && status.type === 'ERROR' && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                                <CameraOff className="h-16 w-16 mb-4" />
                                <h3 className="text-lg font-bold">Camera Access Denied</h3>
                                <p>Please enable camera permissions in browser settings.</p>
                            </div>
                        )}
                    </div>
                    <Card className="p-4">
                        <div className="flex items-center gap-4">
                            <StatusIcon />
                            <div className="flex-1">
                                <p className="font-semibold">{status.type.charAt(0).toUpperCase() + status.type.slice(1).toLowerCase()}</p>
                                <p className="text-sm text-muted-foreground">{isActive ? status.message : 'Kiosk is paused.'}</p>
                            </div>
                        </div>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Today's Attendance Log</CardTitle>
                    <CardDescription>Live log for {format(new Date(), 'PP')}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[25rem] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card">
                                <TableRow>
                                    <TableHead>{personType} Name</TableHead>
                                    <TableHead>In Time</TableHead>
                                    <TableHead>Out Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todaysLog.length > 0 ? (
                                    [...todaysLog].sort((a, b) => (b.inTime ?? '').localeCompare(a.inTime ?? '')).map(record => (
                                        <TableRow key={record.personId}>
                                            <TableCell className="font-medium">{getPersonName(record.personId)}</TableCell>
                                            <TableCell>{record.inTime ? format(new Date(record.inTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{record.outTime ? format(new Date(record.outTime), 'p') : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No attendance marked today.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StudentKiosk = ({ isActive }: { isActive: boolean }) => {
    const { students, isInitialized } = useStudentStore();
    const { attendance, markAttendance } = useStudentAttendanceStore();
    const { toast } = useToast();
    const [status, setStatus] = useState<{ type: ScanStatusType; message: string; }>({ type: 'IDLE', message: 'Initializing...' });
    const [todaysLog, setTodaysLog] = useState<Attendance[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isScanningRef = useRef(false);
    const lastScanTimestampsRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);

    const getPersonName = useCallback((personId: string) => students.find(p => p.id === personId)?.name || 'Unknown', [students]);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setTodaysLog(attendance.filter(record => record.date === today));
    }, [attendance]);

    useEffect(() => {
        if (!isActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if(videoRef.current) videoRef.current.srcObject = null;
            return;
        }

        if (!isInitialized) return;

        let scanIntervalId: NodeJS.Timeout | null = null;
        
        const startKiosk = async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) videoRef.current.srcObject = streamRef.current;
                setStatus({ type: 'IDLE', message: 'Ready to scan students.' });
            } catch (error) {
                console.error('Camera Error (Students):', error);
                setStatus({ type: 'ERROR', message: 'Camera access denied.' });
                return;
            }

            scanIntervalId = setInterval(async () => {
                if (isScanningRef.current || !videoRef.current?.srcObject || !canvasRef.current || students.length === 0 || document.hidden) return;
                isScanningRef.current = true;
                setStatus(s => s.type !== 'SCANNING' ? { type: 'SCANNING', message: 'Scanning...' } : s);
                
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

                try {
                    const personList = students.filter(p => p.photoUrl).map(p => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }));
                    if (personList.length === 0) {
                        setStatus({ type: 'ERROR', message: `No students with photos found.` });
                        if(scanIntervalId) clearInterval(scanIntervalId);
                        return;
                    }
                    const result = await recognizeFace({ capturedPhotoDataUri, personList, personType: 'Student' });

                    if (result.matchedPersonId) {
                        const matchedPerson = students.find(p => p.id === result.matchedPersonId);
                        if (matchedPerson) {
                            const punchType = markAttendance(matchedPerson);
                            if (punchType === 'in') {
                                const now = Date.now();
                                if (now - (lastScanTimestampsRef.current[matchedPerson.id] || 0) < PERSON_COOLDOWN_MS) {
                                    setStatus({ type: 'IDLE', message: `${matchedPerson.name} recently scanned.` });
                                } else {
                                    lastScanTimestampsRef.current[matchedPerson.id] = now;
                                    toast({ title: 'Welcome!', description: `${matchedPerson.name} clocked in.` });
                                    setStatus({ type: 'SUCCESS', message: `${matchedPerson.name} clocked in.` });
                                }
                            } else {
                                toast({ title: 'Goodbye!', description: `${matchedPerson.name} clocked out.` });
                                setStatus({ type: 'SUCCESS', message: `${matchedPerson.name} clocked out.` });
                            }
                        }
                    } else {
                        setStatus({ type: 'IDLE', message: 'No match found.' });
                    }
                } catch (e) { console.error(e); setStatus({ type: 'IDLE', message: 'Scan error.' }); } finally {
                    isScanningRef.current = false;
                }
            }, SCAN_INTERVAL_MS);
        };
        startKiosk();
        return () => { if (scanIntervalId) clearInterval(scanIntervalId); };
    }, [isActive, isInitialized, students, markAttendance, toast]);
    
    return <KioskUI personType="Student" status={status} videoRef={videoRef} canvasRef={canvasRef} todaysLog={todaysLog} getPersonName={getPersonName} isActive={isActive} />;
};

const StaffKiosk = ({ isActive }: { isActive: boolean }) => {
    const { staff, isInitialized } = useStaffStore();
    const { attendance, markAttendance } = useAttendanceStore();
    const { toast } = useToast();
    const [status, setStatus] = useState<{ type: ScanStatusType; message: string; }>({ type: 'IDLE', message: 'Initializing...' });
    const [todaysLog, setTodaysLog] = useState<Attendance[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isScanningRef = useRef(false);
    const lastScanTimestampsRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);

    const getPersonName = useCallback((personId: string) => staff.find(p => p.id === personId)?.name || 'Unknown', [staff]);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setTodaysLog(attendance.filter(record => record.date === today));
    }, [attendance]);

    useEffect(() => {
        if (!isActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if(videoRef.current) videoRef.current.srcObject = null;
            return;
        }

        if (!isInitialized) return;

        let scanIntervalId: NodeJS.Timeout | null = null;
        
        const startKiosk = async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) videoRef.current.srcObject = streamRef.current;
                setStatus({ type: 'IDLE', message: 'Ready to scan staff.' });
            } catch (error) {
                console.error('Camera Error (Staff):', error);
                setStatus({ type: 'ERROR', message: 'Camera access denied.' });
                return;
            }
            
            scanIntervalId = setInterval(async () => {
                if (isScanningRef.current || !videoRef.current?.srcObject || !canvasRef.current || staff.length === 0 || document.hidden) return;
                isScanningRef.current = true;
                setStatus(s => s.type !== 'SCANNING' ? { type: 'SCANNING', message: 'Scanning...' } : s);
                
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

                try {
                    const personList = staff.filter(p => p.photoUrl).map(p => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }));
                    if (personList.length === 0) {
                        setStatus({ type: 'ERROR', message: `No staff with photos found.` });
                        if(scanIntervalId) clearInterval(scanIntervalId);
                        return;
                    }

                    const result = await recognizeFace({ capturedPhotoDataUri, personList, personType: 'Staff' });
                    if (result.matchedPersonId) {
                        const matchedPerson = staff.find(p => p.id === result.matchedPersonId);
                        if (matchedPerson) {
                             const punchType = markAttendance(matchedPerson);
                            if (punchType === 'in') {
                                const now = Date.now();
                                if (now - (lastScanTimestampsRef.current[matchedPerson.id] || 0) < PERSON_COOLDOWN_MS) {
                                    setStatus({ type: 'IDLE', message: `${matchedPerson.name} recently scanned.` });
                                } else {
                                    lastScanTimestampsRef.current[matchedPerson.id] = now;
                                    toast({ title: 'Welcome!', description: `${matchedPerson.name} clocked in.` });
                                    setStatus({ type: 'SUCCESS', message: `${matchedPerson.name} clocked in.` });
                                }
                            } else {
                                toast({ title: 'Goodbye!', description: `${matchedPerson.name} clocked out.` });
                                setStatus({ type: 'SUCCESS', message: `${matchedPerson.name} clocked out.` });
                            }
                        }
                    } else {
                        setStatus({ type: 'IDLE', message: 'No match found.' });
                    }
                } catch (e) { console.error(e); setStatus({ type: 'IDLE', message: 'Scan error.' }); } finally {
                    isScanningRef.current = false;
                }
            }, SCAN_INTERVAL_MS);
        };
        startKiosk();
        return () => { if (scanIntervalId) clearInterval(scanIntervalId); };
    }, [isActive, isInitialized, staff, markAttendance, toast]);
    
    return <KioskUI personType="Staff" status={status} videoRef={videoRef} canvasRef={canvasRef} todaysLog={todaysLog} getPersonName={getPersonName} isActive={isActive} />;
};

export default function UnifiedAttendanceKioskPage() {
    const [currentTime, setCurrentTime] = useState('');
    const [activeTab, setActiveTab] = useState('student');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(format(new Date(), 'EEEE, MMMM d, yyyy, h:mm:ss a'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Automated Attendance Kiosk</h1>
                <p className="text-muted-foreground">{currentTime}</p>
            </div>

            <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="student">Student Kiosk</TabsTrigger>
                    <TabsTrigger value="staff">Staff Kiosk</TabsTrigger>
                </TabsList>
                <TabsContent value="student" className="mt-6">
                    <StudentKiosk isActive={activeTab === 'student'} />
                </TabsContent>
                <TabsContent value="staff" className="mt-6">
                    <StaffKiosk isActive={activeTab === 'staff'} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
