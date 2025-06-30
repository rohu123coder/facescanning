
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, MapPin, CheckCircle, AlertTriangle, Clock, Ban } from 'lucide-react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, getMonth, getYear, differenceInHours } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useClientStore } from '@/hooks/use-client-store.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type AttendanceStep = 'IDLE' | 'GETTING_GPS' | 'READY' | 'SAVING';

// Haversine formula to calculate distance between two lat/lon points in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}

export default function MyAttendancePage() {
    const { employee, isAuthInitialized } = useEmployeeAuthStore();
    const { currentClient, isInitialized: isClientInitialized } = useClientStore();
    const { attendance, markAttendance, isInitialized } = useAttendanceStore();
    const { toast } = useToast();

    const [step, setStep] = useState<AttendanceStep>('IDLE');
    const [currentTime, setCurrentTime] = useState('');
    const [statusMessage, setStatusMessage] = useState('Click below to start the attendance process.');
    const [todaysRecord, setTodaysRecord] = useState<{inTime: string | null; outTime: string | null} | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

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
        if (!employee || !currentClient) return;
        
        if (todaysRecord?.outTime) {
            toast({ variant: 'destructive', title: 'Already Clocked Out', description: 'You have already completed your attendance for today.'});
            return;
        }

        if (!currentClient.officeLatitude || !currentClient.officeLongitude) {
            toast({ variant: 'destructive', title: 'GPS Not Configured', description: 'Your employer has not set the office location. Please contact your admin.' });
            return;
        }

        setStep('GETTING_GPS');
        setStatusMessage('Getting your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const distance = getDistance(
                    position.coords.latitude, 
                    position.coords.longitude,
                    currentClient.officeLatitude!,
                    currentClient.officeLongitude!
                );

                if (distance <= currentClient.gpsRadius) {
                    toast({ title: 'GPS Location Verified', description: 'You are at the office. Ready to mark attendance.' });
                    setStep('READY');
                    setStatusMessage('GPS Verified. Please confirm with your fingerprint.');
                } else {
                     toast({ variant: 'destructive', title: 'Location Mismatch', description: `You are approximately ${Math.round(distance)} meters away from the office.` });
                     setStep('IDLE');
                     setStatusMessage('Verification failed. You are not at the office location.');
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                toast({
                    variant: 'destructive',
                    title: 'GPS Error',
                    description: 'Could not get your location. Please ensure location services are enabled.',
                    duration: 7000
                });
                setStep('IDLE');
                setStatusMessage('GPS failed. Please try again.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [employee, toast, todaysRecord, currentClient]);

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


    if (!isAuthInitialized || !isInitialized || !isClientInitialized || !employee) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
    }

    const filteredAttendance = useMemo(() => {
        return attendance
            .filter(record => 
                record.personId === employee.id &&
                getMonth(parseISO(record.date)) === parseInt(selectedMonth) &&
                getYear(parseISO(record.date)) === parseInt(selectedYear)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, employee.id, selectedMonth, selectedYear]);

    const calculateTotalHours = (inTime: string | null, outTime: string | null): string => {
        if (!inTime || !outTime) return 'N/A';
        try {
            const hours = differenceInHours(parseISO(outTime), parseISO(inTime));
            return `${hours} hour(s)`;
        } catch (error) {
            return 'Invalid';
        }
    };
    
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
    }, []);

    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        label: format(new Date(2000, i), 'MMMM'),
        }));
    }, []);
    
    const punchType = (todaysRecord?.inTime && !todaysRecord?.outTime) ? 'out' : 'in';
    const isGpsConfigured = currentClient && currentClient.officeLatitude && currentClient.officeLongitude;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Attendance</h1>
                <p className="text-muted-foreground">Mark your daily presence and view your history.</p>
            </div>
            
            <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">Attendance Terminal</CardTitle>
                    <CardDescription>Live time: {currentTime}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col items-center">
                   {step === 'IDLE' && <Button size="lg" className="h-24 w-24 rounded-full" onClick={handleMarkAttendance} disabled={!!todaysRecord?.outTime || !isGpsConfigured}><Fingerprint className="h-12 w-12"/></Button>}
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

                         {!isGpsConfigured && (
                           <Alert variant="destructive">
                                <Ban className="h-4 w-4"/>
                                <AlertTitle>GPS Location Not Set</AlertTitle>
                                <AlertDescription>
                                Your employer has not configured the office GPS location. Attendance cannot be marked.
                                </AlertDescription>
                            </Alert>
                         )}

                         {todaysRecord?.outTime && (
                           <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 !text-green-600"/>
                                <AlertTitle>Attendance Complete</AlertTitle>
                                <AlertDescription>
                                Your attendance for today is complete. Have a great day!
                                </AlertDescription>
                            </Alert>
                         )}

                         {step === 'IDLE' && !todaysRecord?.outTime && isGpsConfigured && (
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

            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>View your attendance log for a selected period.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>In Time</TableHead>
                                    <TableHead>Out Time</TableHead>
                                    <TableHead>Total Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttendance.length > 0 ? (
                                    filteredAttendance.map(record => (
                                        <TableRow key={record.date}>
                                            <TableCell>{format(parseISO(record.date), 'PPP')}</TableCell>
                                            <TableCell>{record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{calculateTotalHours(record.inTime, record.outTime)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No attendance records found for the selected period.
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
