'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, UserCheck, UserX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStaffStore } from '@/hooks/use-staff-store';
import { recognizeStaffFace } from '@/ai/flows/face-scan-attendance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { type Staff, type Attendance } from '@/lib/data';
import { useClientStore } from '@/hooks/use-client-store';

const getAttendanceStoreKey = (clientId: string | undefined) => {
    if (!clientId) return null;
    const today = format(new Date(), 'yyyy-MM-dd');
    return `attendance_${clientId}_${today}`;
};

type ScanStatusType = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'NO_MATCH' | 'ERROR';
const SCAN_INTERVAL_MS = 3000; // Scan every 3 seconds
const EMPLOYEE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export default function AttendanceKioskPage() {
  const { staff, isInitialized: isStaffInitialized } = useStaffStore();
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState('');
  const [status, setStatus] = useState<{
    type: ScanStatusType;
    message: string;
  }>({ type: 'IDLE', message: 'Initializing Camera...' });
  const [isCameraOn, setIsCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const lastScanTimestampsRef = useRef<Record<string, number>>({});
  
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const { currentClient } = useClientStore();
  const storeKey = getAttendanceStoreKey(currentClient?.id);

  // Load attendance from local storage
  useEffect(() => {
    if (storeKey) {
      const storedAttendance = localStorage.getItem(storeKey);
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
      } else {
        setAttendance([]); // Ensure it's reset if key changes and no data exists
      }
    }
  }, [storeKey]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'EEEE, MMMM d, yyyy, h:mm:ss a'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const markAttendance = useCallback((staffMember: Staff): 'in' | 'out' => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const time = now.toISOString();
      let punchTypeResult: 'in' | 'out' = 'in';
  
      if (storeKey) {
          const storedData = localStorage.getItem(storeKey);
          const currentAttendance: Attendance[] = storedData ? JSON.parse(storedData) : [];
          
          const existingRecordIndex = currentAttendance.findIndex(record => record.staffId === staffMember.id);
  
          if (existingRecordIndex > -1) {
              currentAttendance[existingRecordIndex].outTime = time;
              punchTypeResult = 'out';
          } else {
              const newRecord: Attendance = {
                  staffId: staffMember.id,
                  staffName: staffMember.name,
                  date: today,
                  inTime: time,
                  outTime: null,
              };
              currentAttendance.push(newRecord);
              punchTypeResult = 'in';
          }
          localStorage.setItem(storeKey, JSON.stringify(currentAttendance));
          setAttendance(currentAttendance);
      }
      return punchTypeResult;
  }, [storeKey]);

  // Main camera and scanning loop effect
  useEffect(() => {
    if (!isStaffInitialized) return;

    let scanIntervalId: NodeJS.Timeout | null = null;
    
    const startKiosk = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        setIsCameraOn(true);
        setStatus({ type: 'IDLE', message: 'Ready to scan. Position your face in the frame.' });
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus({ type: 'ERROR', message: 'Camera access denied. Please enable it in browser settings.' });
        setIsCameraOn(false);
        return;
      }
      
      const performScan = async () => {
        if (isScanningRef.current || !videoRef.current?.srcObject || !canvasRef.current || staff.length === 0 || document.hidden) {
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
          const staffListForRecognition = staff.map(s => ({ id: s.id, name: s.name, photoUrl: s.photoUrl }));
          const result = await recognizeStaffFace({ capturedPhotoDataUri, staffList: staffListForRecognition });

          if (result.matchedStaffId) {
            const matchedStaff = staff.find(s => s.id === result.matchedStaffId);
            if (matchedStaff) {
              const now = Date.now();
              const lastScanTime = lastScanTimestampsRef.current[matchedStaff.id] || 0;

              if (now - lastScanTime < EMPLOYEE_COOLDOWN_MS) {
                 setStatus(s => s.type !== 'SUCCESS' ? { type: 'IDLE', message: `${matchedStaff.name} already checked in recently.` } : s);
              } else {
                lastScanTimestampsRef.current[matchedStaff.id] = now;
                const punchType = markAttendance(matchedStaff);
                const welcomeMessage = punchType === 'in' ? 'Welcome' : 'Goodbye';
                
                toast({
                  title: `Attendance Marked: ${punchType === 'in' ? 'Clock In' : 'Clock Out'}`,
                  description: `${welcomeMessage}, ${matchedStaff.name}!`,
                });
                
                setStatus({ type: 'SUCCESS', message: `${welcomeMessage}, ${matchedStaff.name}!` });
                setTimeout(() => setStatus({ type: 'IDLE', message: 'Ready to scan. Position your face in the frame.' }), 2000);
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
      console.log('Cleaning up attendance kiosk...');
      if (scanIntervalId) clearInterval(scanIntervalId);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      console.log('Camera cleanup complete.');
    };
  }, [isStaffInitialized, staff, toast, markAttendance, storeKey]);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Automated Attendance Kiosk</h1>
        <p className="text-muted-foreground">{currentTime}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">AI Face Scan</CardTitle>
            <CardDescription>The system will automatically detect and record attendance.</CardDescription>
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
                        <p className="font-semibold">{status.type}</p>
                        <p className="text-sm text-muted-foreground">{status.message}</p>
                    </div>
                </div>
            </Card>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Today's Attendance Log</CardTitle>
            <CardDescription>Live log of staff clock-ins and clock-outs for {format(new Date(), 'PP')}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[25rem] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>In Time</TableHead>
                    <TableHead>Out Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length > 0 ? (
                    [...attendance].sort((a,b) => (b.inTime ?? '').localeCompare(a.inTime ?? '')).map(record => (
                      <TableRow key={record.staffId}>
                        <TableCell className="font-medium">{record.staffName}</TableCell>
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
    </div>
  );
}

// Minimal useClientStore to get currentClient.id
// In a real app this would be more robust.
function useClientStore() {
    const [currentClient, setCurrentClient] = useState<{id: string} | null>(null);
    useEffect(() => {
        try {
            const loggedInClientId = localStorage.getItem('loggedInClientId');
            if (loggedInClientId) {
                // For this component, we only need the ID.
                setCurrentClient({ id: loggedInClientId });
            }
        } catch (e) {
            console.error(e)
        }
    }, []);
    return { currentClient };
}
