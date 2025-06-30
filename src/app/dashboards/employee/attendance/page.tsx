'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, MapPin, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AttendanceStep = 'IDLE' | 'GETTING_GPS' | 'READY' | 'SAVING';

export default function MyAttendancePage() {
    const { employee, isAuthInitialized } = useEmployeeAuthStore();
    const { attendance, markAttendance, isInitialized } = useAttendanceStore();
    const { toast } = useToast();

    const [step, setStep] = useState<AttendanceStep>('IDLE');
    const [currentTime, setCurrentTime] = useState('');
    const [statusMessage, setStatusMessage] = useState('Click below to start the attendance process.');
    const [todaysRecord, setTodaysRecord] = useState<{inTime: string | null; outTime: string | null} | null>(null);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(format(new Date(), 'h:mm:ss a'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Update today's record from store
    useEffect(() => {
        if (isInitialized && employee) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const record = attendance.find(a => a.personId === employee.id && a.date === today);
            setTodaysRecord(record ? { inTime: record.inTime, outTime: record.outTime } : null);
        }
    }, [attendance, employee, isInitialized]);

    const handleMarkAttendance = useCallback(() => {
        if (!employee) return;
        
        // Prevent marking if already clocked out for the day
        if (todaysRecord?.outTime) {
            toast({ variant: 'destructive', title: 'Already Clocked Out', description: 'You have already completed your attendance for today.'});
            return;
        }

        setStep('GETTING_GPS');
        setStatusMessage('Getting your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, you would validate position.coords against office coordinates.
                // For this prototype, we'll assume any successful GPS fix is valid.
                console.log('GPS Coords:', position.coords);
                toast({ title: 'GPS Location Acquired', description: 'Ready to mark attendance.' });
                setStep('READY');
                setStatusMessage('GPS Verified. Please confirm with your fingerprint.');
            },
            (error) => {
                console.error("GPS Error:", error);
                toast({
                    variant: 'destructive',
                    title: 'GPS Error',
                    description: 'Could not get your location. Please ensure location services are enabled and you have a clear view of the sky.',
                    duration: 7000
                });
                setStep('IDLE');
                setStatusMessage('GPS failed. Please try again.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [employee, toast, todaysRecord]);

    const handleFingerprintConfirm = useCallback(() => {
        if (!employee) return;
        
        setStep('SAVING');
        setStatusMessage('Saving your attendance...');
        
        // Simulate a quick save
        setTimeout(() => {
            const punchType = markAttendance(employee);
            toast({
                title: 'Attendance Marked!',
                description: `You have successfully clocked ${punchType}.`,
            });
            setStep('IDLE');
            setStatusMessage('Your attendance has been recorded.');
        }, 500);

    }, [employee, markAttendance, toast]);


    if (!isAuthInitialized || !isInitialized) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
    }
    
    const punchType = (todaysRecord?.inTime && !todaysRecord?.outTime) ? 'out' : 'in';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Attendance</h1>
                <p className="text-muted-foreground">Mark your daily presence using your mobile.</p>
            </div>
            
            <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">Attendance Terminal</CardTitle>
                    <CardDescription>Live time: {currentTime}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col items-center">
                   {step === 'IDLE' && <Button size="lg" className="h-24 w-24 rounded-full" onClick={handleMarkAttendance} disabled={!!todaysRecord?.outTime}><Fingerprint className="h-12 w-12"/></Button>}
                   {step === 'GETTING_GPS' && <Loader2 className="h-24 w-24 text-primary animate-spin" />}
                   {step === 'READY' && <Button size="lg" className="h-24 w-24 rounded-full bg-green-500 hover:bg-green-600" onClick={handleFingerprintConfirm}><CheckCircle className="h-12 w-12"/></Button>}
                   {step === 'SAVING' && <Loader2 className="h-24 w-24 text-primary animate-spin" />}

                    <div className="text-center h-10">
                        {step === 'GETTING_GPS' && <p className="flex items-center gap-2 text-primary"><MapPin/> {statusMessage}</p>}
                        {step === 'READY' && <p className="flex items-center gap-2 text-green-600"><Fingerprint/> {statusMessage}</p>}
                        {step !== 'GETTING_GPS' && step !== 'READY' && <p className="text-muted-foreground">{statusMessage}</p>}
                    </div>

                    <div className="w-full space-y-4">
                        <div className="border rounded-lg p-4 space-y-2">
                             <h3 className="font-semibold text-center">Today's Log: {format(new Date(), 'PPP')}</h3>
                             <div className="flex justify-around">
                                 <div className="text-center">
                                     <p className="text-sm text-muted-foreground">Clock In</p>
                                     <p className="font-bold text-lg">{todaysRecord?.inTime ? format(parseISO(todaysRecord.inTime), 'p') : '--:--'}</p>
                                 </div>
                                  <div className="text-center">
                                     <p className="text-sm text-muted-foreground">Clock Out</p>
                                     <p className="font-bold text-lg">{todaysRecord?.outTime ? format(parseISO(todaysRecord.outTime), 'p') : '--:--'}</p>
                                 </div>
                             </div>
                        </div>

                         {todaysRecord?.outTime && (
                           <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 !text-green-600"/>
                                <AlertTitle>Attendance Complete</AlertTitle>
                                <AlertDescription>
                                Your attendance for today is complete. Have a great day!
                                </AlertDescription>
                            </Alert>
                         )}

                         {step === 'IDLE' && !todaysRecord?.outTime && (
                            <Alert variant="default">
                                <Clock className="h-4 w-4"/>
                                <AlertTitle>Ready to Clock {punchType.charAt(0).toUpperCase() + punchType.slice(1)}</AlertTitle>
                                <AlertDescription>
                                Click the fingerprint button to begin the clock-{punchType} process.
                                </AlertDescription>
                            </Alert>
                         )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
