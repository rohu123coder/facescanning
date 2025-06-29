
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, UserCheck, UserX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recognizeStaffFace } from '@/ai/flows/face-scan-attendance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { type Student, type Staff, type Attendance } from '@/lib/data';

type ScanStatusType = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'NO_MATCH' | 'ERROR';
const SCAN_INTERVAL_MS = 3000;
const PERSON_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface GenericAttendanceKioskProps<T extends Student | Staff> {
    personType: 'Student' | 'Staff';
    persons: T[];
    isPersonsInitialized: boolean;
    attendance: Attendance[];
    isAttendanceInitialized: boolean;
    markAttendance: (person: T) => 'in' | 'out';
}

export function GenericAttendanceKiosk<T extends Student | Staff>({
    personType,
    persons,
    isPersonsInitialized,
    attendance,
    isAttendanceInitialized,
    markAttendance,
}: GenericAttendanceKioskProps<T>) {
    const { toast } = useToast();
    const [status, setStatus] = useState<{
        type: ScanStatusType;
        message: string;
    }>({ type: 'IDLE', message: 'Initializing Camera...' });
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [todaysLog, setTodaysLog] = useState<Attendance[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isScanningRef = useRef(false);
    const lastScanTimestampsRef = useRef<Record<string, number>>({});

    const getPersonName = (personId: string) => {
        return persons.find(p => p.id === personId)?.name || `Unknown ${personType}`;
    };

    // Update today's log when the full attendance list changes
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const filteredLog = attendance.filter(record => record.date === today);
        setTodaysLog(filteredLog);
    }, [attendance]);

    // Main camera and scanning loop effect
    useEffect(() => {
        if (!isPersonsInitialized || !isAttendanceInitialized) return;

        let stream: MediaStream | null = null;
        let scanIntervalId: NodeJS.Timeout | null = null;

        const startKiosk = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraOn(true);
                setStatus({ type: 'IDLE', message: `Ready to scan. ${personType}s, please position your face in the frame.` });
            } catch (error) {
                console.error('Error accessing camera:', error);
                setStatus({ type: 'ERROR', message: 'Camera access denied. Please enable it in browser settings.' });
                setIsCameraOn(false);
                return;
            }

            const performScan = async () => {
                if (isScanningRef.current || !videoRef.current?.srcObject || !canvasRef.current || persons.length === 0 || document.hidden) {
                    return;
                }

                isScanningRef.current = true;
                setStatus(s => s.type !== 'SCANNING' ? { type: 'SCANNING', message: 'Scanning...' } : s);

                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

                try {
                    const personListForRecognition = persons.map(p => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }));
                    const result = await recognizeStaffFace({ capturedPhotoDataUri, staffList: personListForRecognition });

                    if (result.matchedStaffId) {
                        const matchedPerson = persons.find(p => p.id === result.matchedStaffId);
                        if (matchedPerson) {
                            const now = Date.now();
                            const lastScanTime = lastScanTimestampsRef.current[matchedPerson.id] || 0;

                            if (now - lastScanTime < PERSON_COOLDOWN_MS) {
                                setStatus(s => s.type !== 'SUCCESS' ? { type: 'IDLE', message: `${matchedPerson.name} already checked in recently.` } : s);
                            } else {
                                lastScanTimestampsRef.current[matchedPerson.id] = now;
                                const punchType = markAttendance(matchedPerson);
                                const welcomeMessage = punchType === 'in' ? 'Welcome' : 'Goodbye';
                                
                                toast({
                                    title: `Attendance Marked: ${punchType === 'in' ? 'Clock In' : 'Clock Out'}`,
                                    description: `${welcomeMessage}, ${matchedPerson.name}!`,
                                });
                                
                                setStatus({ type: 'SUCCESS', message: `${welcomeMessage}, ${matchedPerson.name}!` });
                                setTimeout(() => setStatus({ type: 'IDLE', message: `Ready to scan. ${personType}s, please position your face in the frame.` }), 2000);
                            }
                        } else {
                            setStatus({ type: 'IDLE', message: 'No match found. Please try again.' });
                        }
                    } else {
                        setStatus({ type: 'IDLE', message: 'No match found. Please position your face clearly.' });
                    }
                } catch (error) {
                    console.error('AI Recognition Error:', error);
                    setStatus({ type: 'IDLE', message: 'An error occurred. Retrying automatically.' });
                    toast({ variant: 'destructive', title: 'An Error Occurred', description: 'AI recognition failed.' });
                } finally {
                    isScanningRef.current = false;
                }
            };
            scanIntervalId = setInterval(performScan, SCAN_INTERVAL_MS);
        };

        startKiosk();

        return () => {
            if (scanIntervalId) clearInterval(scanIntervalId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setIsCameraOn(false);
        };
    }, [isPersonsInitialized, isAttendanceInitialized, persons, toast, markAttendance, personType]);

    const StatusIcon = () => {
        switch (status.type) {
            case 'SCANNING': return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
            case 'SUCCESS': return <UserCheck className="h-6 w-6 text-green-500" />;
            case 'NO_MATCH': return <UserX className="h-6 w-6 text-destructive" />;
            case 'ERROR': return <ShieldAlert className="h-6 w-6 text-destructive" />;
            case 'IDLE': default: return <Camera className="h-6 w-6 text-muted-foreground" />;
        }
    }

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
                        {(!isCameraOn && status.type === 'ERROR') && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                                <Camera className="h-16 w-16 mb-4" />
                                <h3 className="text-lg font-bold">Camera Access Denied</h3>
                                <p>Please enable camera permissions in your browser settings to use the kiosk.</p>
                            </div>
                        )}
                        {(!isCameraOn && status.type !== 'ERROR') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                <Loader2 className="h-16 w-16 mb-4 animate-spin text-primary" />
                                <p className="text-muted-foreground">Starting camera...</p>
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
                    <CardDescription>Live log of {personType.toLowerCase()} clock-ins and clock-outs for {format(new Date(), 'PP')}.</CardDescription>
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
                                    [...todaysLog].sort((a,b) => (b.inTime ?? '').localeCompare(a.inTime ?? '')).map(record => (
                                        <TableRow key={record.personId}>
                                            <TableCell className="font-medium">{getPersonName(record.personId)}</TableCell>
                                            <TableCell>{record.inTime ? format(new Date(record.inTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{record.outTime ? format(new Date(record.outTime), 'p') : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No attendance marked for today yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
