
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
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

export default function UnifiedAttendanceKioskPage() {
    const { students, isInitialized: studentsInitialized } = useStudentStore();
    const { staff, isInitialized: staffInitialized } = useStaffStore();
    const studentAttendanceStore = useStudentAttendanceStore();
    const staffAttendanceStore = useAttendanceStore();
    const { toast } = useToast();
    
    const [currentTime, setCurrentTime] = useState('');
    const [status, setStatus] = useState<{ type: ScanStatusType; message: string; }>({ type: 'IDLE', message: 'Initializing...' });
    const [todaysLog, setTodaysLog] = useState<Attendance[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isScanningRef = useRef(false);
    const lastScanTimestampsRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);

    const getPersonName = useCallback((personId: string) => {
        return students.find(p => p.id === personId)?.name || staff.find(p => p.id === personId)?.name || 'Unknown';
    }, [students, staff]);

    // Update the live log whenever either attendance store changes
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const combinedLog = [
            ...studentAttendanceStore.attendance,
            ...staffAttendanceStore.attendance
        ].filter(record => record.date === today);
        setTodaysLog(combinedLog);
    }, [studentAttendanceStore.attendance, staffAttendanceStore.attendance]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(format(new Date(), 'EEEE, MMMM d, yyyy, h:mm:ss a'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Main Kiosk Loop
    useEffect(() => {
        if (!studentsInitialized || !staffInitialized) return;

        let scanIntervalId: NodeJS.Timeout | null = null;
        
        const startKiosk = async () => {
            try {
                // Only request the camera if it's not already running
                if (!streamRef.current) {
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
                }
                setStatus({ type: 'IDLE', message: 'Ready to scan. Please position your face in the frame.' });
            } catch (error) {
                console.error('Camera Error:', error);
                setStatus({ type: 'ERROR', message: 'Camera access denied. Please enable it in browser settings.' });
                return;
            }

            scanIntervalId = setInterval(async () => {
                if (isScanningRef.current || !videoRef.current?.srcObject || !canvasRef.current || document.hidden) return;
                
                isScanningRef.current = true;
                setStatus(s => s.type !== 'SCANNING' ? { type: 'SCANNING', message: 'Scanning...' } : s);

                const today = format(new Date(), 'yyyy-MM-dd');
                const currentDayLog = [
                    ...studentAttendanceStore.attendance,
                    ...staffAttendanceStore.attendance
                ].filter(record => record.date === today);

                const clockedOutIds = new Set(
                    currentDayLog.filter(r => r.inTime && r.outTime).map(r => r.personId)
                );
                
                const personListForRecognition = [
                    ...students.filter(s => s.photoUrl && !clockedOutIds.has(s.id)).map(s => ({ id: s.id, name: s.name, photoUrl: s.photoUrl, personType: 'Student' as const })),
                    ...staff.filter(s => s.photoUrl && !clockedOutIds.has(s.id)).map(s => ({ id: s.id, name: s.name, photoUrl: s.photoUrl, personType: 'Staff' as const })),
                ];
                
                if (personListForRecognition.length === 0) {
                     setStatus({ type: 'IDLE', message: 'All registered persons have clocked out for the day.' });
                     isScanningRef.current = false;
                     return;
                }
                
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

                try {
                    const result = await recognizeFace({ capturedPhotoDataUri, personList: personListForRecognition });

                    if (result.matchedPersonId && result.personType) {
                        const now = Date.now();
                        // Check if this person was scanned in the last 5 minutes to prevent spamming
                        if (now - (lastScanTimestampsRef.current[result.matchedPersonId] || 0) < PERSON_COOLDOWN_MS) {
                            const personName = getPersonName(result.matchedPersonId);
                            setStatus({ type: 'SUCCESS', message: `Already punched successfully.` });
                            toast({
                                title: `Duplicate Scan`,
                                description: `${personName}, you have already been scanned recently. Please wait before scanning again.`,
                            });
                        } else {
                            // It's a valid scan, proceed to mark attendance.
                            let personName = '';
                            let punchType: 'in' | 'out' = 'in';

                            if (result.personType === 'Student') {
                                const matchedStudent = students.find(p => p.id === result.matchedPersonId);
                                if (matchedStudent) {
                                    personName = matchedStudent.name;
                                    punchType = studentAttendanceStore.markAttendance(matchedStudent);
                                }
                            } else if (result.personType === 'Staff') {
                                const matchedStaff = staff.find(p => p.id === result.matchedPersonId);
                                if (matchedStaff) {
                                    personName = matchedStaff.name;
                                    punchType = staffAttendanceStore.markAttendance(matchedStaff);
                                }
                            }
                            
                            if (personName) {
                                // A valid punch occurred, so update the timestamp for the cooldown.
                                lastScanTimestampsRef.current[result.matchedPersonId] = now; 
                                const welcomeMessage = punchType === 'in' ? 'Welcome' : 'Goodbye';
                                toast({ title: `${welcomeMessage}!`, description: `${personName} clocked ${punchType}.` });
                                setStatus({ type: 'SUCCESS', message: `${personName} clocked ${punchType}.` });
                            } else {
                                setStatus({ type: 'NO_MATCH', message: 'Match found but person details not available.' });
                            }
                        }
                    } else {
                        setStatus({ type: 'IDLE', message: 'No match found. Please position your face clearly.' });
                    }
                } catch (e) { 
                    console.error('AI Recognition Error:', e); 
                    setStatus({ type: 'IDLE', message: 'Scan error. Retrying...' }); 
                } finally {
                    isScanningRef.current = false;
                }
            }, SCAN_INTERVAL_MS);
        };

        startKiosk();

        return () => { 
            if (scanIntervalId) clearInterval(scanIntervalId); 
            // Do not stop the camera stream here to prevent flicker on re-renders.
        };
    }, [studentsInitialized, staffInitialized, students, staff, studentAttendanceStore, staffAttendanceStore, toast]);

    // Effect to clean up the camera stream ONLY when the component unmounts
    useEffect(() => {
        const stream = streamRef.current;
        return () => {
             if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [])
    
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Unified Attendance Kiosk</h1>
                <p className="text-muted-foreground">{currentTime}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">AI Face Scan</CardTitle>
                        <CardDescription>The system will automatically detect and record both student and staff attendance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                            {status.type === 'ERROR' && (
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
                                    <p className="text-sm text-muted-foreground">{status.message}</p>
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
                                        <TableHead>Name</TableHead>
                                        <TableHead>In Time</TableHead>
                                        <TableHead>Out Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {todaysLog.length > 0 ? (
                                        [...todaysLog].sort((a, b) => (b.inTime ?? '').localeCompare(a.inTime ?? '')).map(record => (
                                            <TableRow key={record.personId + record.date}>
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
        </div>
    );
}
