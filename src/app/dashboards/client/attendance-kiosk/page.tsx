
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserCheck, UserX, ShieldAlert, Fingerprint, Delete, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { recognizeFace } from '@/ai/flows/face-scan-attendance';

import { type Student, type Staff, type Attendance } from '@/lib/data';

type KioskStep = 'ID_ENTRY' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

type Person = (Student & { personType: 'Student' }) | (Staff & { personType: 'Staff' });

const RESULT_DISPLAY_MS = 4000; // 4 seconds to show success/error message

export default function UnifiedAttendanceKioskPage() {
    const { students } = useStudentStore();
    const { staff } = useStaffStore();
    const studentAttendanceStore = useStudentAttendanceStore();
    const staffAttendanceStore = useAttendanceStore();
    const { toast } = useToast();
    
    const [currentTime, setCurrentTime] = useState('');
    const [step, setStep] = useState<KioskStep>('ID_ENTRY');
    const [enteredId, setEnteredId] = useState('');
    const [message, setMessage] = useState('Please enter your Staff or Student ID.');
    const [todaysLog, setTodaysLog] = useState<Attendance[]>([]);
    const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const isVerifyingRef = useRef(false);

    const getPersonName = useCallback((personId: string) => {
        // Prioritize staff ID match
        const staffMember = staff.find(p => p.id === personId);
        if (staffMember) return staffMember.name;
        
        // Then student ID match
        const student = students.find(p => p.id === personId);
        if (student) return student.name;
        
        return 'Unknown';
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
    
    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const resetKiosk = useCallback(() => {
        setEnteredId('');
        setCurrentPerson(null);
        isVerifyingRef.current = false;
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        setStep('ID_ENTRY');
        setMessage('Please enter your Staff or Student ID.');
    }, []);
    
    const handleVerification = useCallback(async (person: Person) => {
        if (isVerifyingRef.current) return;
        isVerifyingRef.current = true;

        // Start camera
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
        } catch (error) {
            setStep('ERROR');
            setMessage('Camera access denied. Please enable it in browser settings.');
            setTimeout(resetKiosk, RESULT_DISPLAY_MS);
            return;
        }
        
        // Wait for camera to be ready, gives a "verifying" feel
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
             setStep('ERROR');
             setMessage('Camera not ready. Please try again.');
             setTimeout(resetKiosk, RESULT_DISPLAY_MS);
             return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const capturedPhotoDataUri = canvas.toDataURL('image/jpeg');

        try {
            let punchType: 'in' | 'out' = 'in';
            let verificationSuccess = true;

            // Perform AI check randomly (10% of the time)
            if (Math.random() <= 0.1) {
                setMessage(`Performing security check for ${person.name}...`);
                const aiResult = await recognizeFace({
                    capturedPhotoDataUri: capturedPhotoDataUri,
                    personList: [{
                        id: person.id,
                        name: person.name,
                        photoUrl: person.photoUrl,
                        personType: person.personType
                    }]
                });

                if (aiResult.matchedPersonId !== person.id) {
                    verificationSuccess = false;
                    setStep('ERROR');
                    setMessage(`Verification Failed for ${person.name}. Face does not match ID.`);
                    toast({ variant: 'destructive', title: 'Security Alert', description: `Face mismatch detected for ID ${person.id}.` });
                } else {
                     setMessage(`Security check passed for ${person.name}.`);
                     // Brief pause to show the message
                     await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (verificationSuccess) {
                if (person.personType === 'Student') {
                    const student = person as Student;
                    punchType = studentAttendanceStore.markAttendance(student);
                    window.dispatchEvent(new CustomEvent('student-attended', {
                        detail: {
                            studentId: student.id,
                            studentName: student.name,
                            punchType: punchType
                        }
                    }));
                } else if (person.personType === 'Staff') {
                    punchType = staffAttendanceStore.markAttendance(person as Staff);
                }
                const welcomeMessage = punchType === 'in' ? 'Welcome' : 'Goodbye';
                setStep('SUCCESS');
                setMessage(`${welcomeMessage}, ${person.name}! You have clocked ${punchType}.`);
                toast({ title: 'Success', description: `${person.name} clocked ${punchType}.` });
            }

        } catch (e) {
            console.error('Error marking attendance:', e);
            setStep('ERROR');
            setMessage('An error occurred while marking attendance.');
        } finally {
            // Reset the kiosk for the next person
            setTimeout(resetKiosk, RESULT_DISPLAY_MS);
        }

    }, [resetKiosk, staffAttendanceStore, studentAttendanceStore, toast]);


    const handleSubmitId = useCallback(() => {
        if (!enteredId) return;

        const foundStaff = staff.find(p => p.id === enteredId);
        const foundStudent = students.find(p => p.rollNumber === enteredId);
        
        if (foundStaff && foundStudent) {
            setStep('ERROR');
            setMessage('Duplicate ID detected. Please contact administrator.');
            setTimeout(resetKiosk, RESULT_DISPLAY_MS);
            return;
        }

        const person: Person | null = foundStaff ? { ...foundStaff, personType: 'Staff' } : (foundStudent ? { ...foundStudent, personType: 'Student'} : null);

        if (person) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const attendanceRecord = (person.personType === 'Student' ? studentAttendanceStore.attendance : staffAttendanceStore.attendance)
                .find(a => a.personId === person.id && a.date === today);

            if (attendanceRecord?.inTime && attendanceRecord?.outTime) {
                setStep('ERROR');
                setMessage(`${person.name}, you have already clocked out for the day.`);
                setTimeout(resetKiosk, RESULT_DISPLAY_MS);
                return;
            }
            
            setCurrentPerson(person);
            setStep('VERIFYING');
            setMessage(`Verifying ${person.name}. Please look at the camera.`);
            handleVerification(person);

        } else {
            setStep('ERROR');
            setMessage('ID not found. Please check and try again.');
            setTimeout(resetKiosk, RESULT_DISPLAY_MS);
        }
    }, [enteredId, staff, students, studentAttendanceStore.attendance, staffAttendanceStore.attendance, handleVerification, resetKiosk]);
    
    const handleKeypadClick = (key: string) => {
        if (enteredId.length < 20) {
            setEnteredId(prev => prev + key);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Unified Attendance Kiosk</h1>
                <p className="text-muted-foreground">{currentTime}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Attendance Terminal</CardTitle>
                        <CardDescription>Enter your ID and look at the camera for verification.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 'ID_ENTRY' && (
                            <div className="flex flex-col items-center gap-4 p-4">
                               <Fingerprint className="w-16 h-16 text-primary mb-4"/>
                               <Input 
                                   readOnly
                                   value={enteredId}
                                   placeholder="Your ID will appear here"
                                   className="text-center text-2xl font-mono h-14"
                                />
                               <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                                        <Button key={key} variant="outline" size="lg" className="text-2xl" onClick={() => handleKeypadClick(key)}>{key}</Button>
                                    ))}
                                    <Button variant="outline" size="lg" className="text-2xl" onClick={() => setEnteredId(prev => prev.slice(0, -1))}><Delete /></Button>
                                    <Button variant="outline" size="lg" className="text-2xl" onClick={() => handleKeypadClick('0')}>0</Button>
                                    <Button size="lg" className="text-xl" onClick={handleSubmitId} disabled={!enteredId}><CheckCircle /></Button>
                               </div>
                            </div>
                        )}
                        {step !== 'ID_ENTRY' && (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center">
                                    {step === 'VERIFYING' && <Loader2 className="h-16 w-16 mb-4 animate-spin" />}
                                    {step === 'SUCCESS' && <UserCheck className="h-16 w-16 mb-4 text-green-500" />}
                                    {step === 'ERROR' && <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />}
                                    <p className="text-lg font-semibold">{message}</p>
                                </div>
                            </div>
                        )}
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
