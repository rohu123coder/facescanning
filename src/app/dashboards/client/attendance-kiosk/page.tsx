'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, UserCheck, UserX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStaffStore } from '@/hooks/use-staff-store';
import { recognizeStaffFace } from '@/ai/flows/face-scan-attendance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { type Staff, type Attendance } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

const getAttendanceStoreKey = (clientId: string | undefined) => {
    if (!clientId) return null;
    const today = format(new Date(), 'yyyy-MM-dd');
    return `attendance_${clientId}_${today}`;
};

type ScanStatus = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'NO_MATCH' | 'ERROR' | 'COOLDOWN';
const COOLDOWN_DURATION = 5000; // 5 seconds
const SCAN_INTERVAL = 3000; // 3 seconds between scan attempts

export default function AttendanceKioskPage() {
  const { staff, isInitialized: isStaffInitialized } = useStaffStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false); // To prevent concurrent scans
  const [currentTime, setCurrentTime] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [status, setStatus] = useState<{
    type: ScanStatus;
    message: string;
    progress?: number;
  }>({ type: 'IDLE', message: 'Initializing Camera...' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout>();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const { currentClient } = useClientStore();
  const storeKey = getAttendanceStoreKey(currentClient?.id);

  // Load attendance from local storage
  useEffect(() => {
    if (storeKey) {
      const storedAttendance = localStorage.getItem(storeKey);
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
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
  
  const updateAttendanceList = (newList: Attendance[]) => {
    setAttendance(newList);
    if (storeKey) {
      localStorage.setItem(storeKey, JSON.stringify(newList));
    }
  };

  const markAttendance = (staffMember: Staff): 'in' | 'out' => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const time = now.toISOString();
    const existingRecordIndex = attendance.findIndex(record => record.staffId === staffMember.id);
    if (existingRecordIndex > -1) {
      const updatedList = [...attendance];
      updatedList[existingRecordIndex].outTime = time;
      updateAttendanceList(updatedList);
      return 'out';
    } else {
      const newRecord: Attendance = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        date: today,
        inTime: time,
        outTime: null,
      };
      updateAttendanceList([...attendance, newRecord]);
      return 'in';
    }
  };

  // The main scanning function
  const handleScan = async () => {
    if (isLoading || !isCameraOn || !videoRef.current || !canvasRef.current || !isStaffInitialized) {
      return;
    }
    if (staff.length === 0) {
      setStatus({ type: 'ERROR', message: 'No staff registered. Please add staff first.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'SCANNING', message: 'Scanning for a face...' });

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
          const punchType = markAttendance(matchedStaff);
          const welcomeMessage = punchType === 'in' ? 'Welcome' : 'Goodbye';
          toast({
            title: `Attendance Marked: ${punchType === 'in' ? 'Clock In' : 'Clock Out'}`,
            description: `${welcomeMessage}, ${matchedStaff.name}! Your attendance has been recorded.`,
          });
          
          setStatus({ type: 'COOLDOWN', message: `${welcomeMessage}, ${matchedStaff.name}!`, progress: 100 });
          let progress = 100;
          const interval = setInterval(() => {
              progress -= (100 / (COOLDOWN_DURATION / 100));
              setStatus(prev => ({ ...prev, progress: progress }));
          }, 100);
          cooldownTimerRef.current = setTimeout(() => {
              clearInterval(interval);
              setStatus({ type: 'IDLE', message: 'Ready to scan. Position your face in the frame.' });
              setIsLoading(false);
          }, COOLDOWN_DURATION);
        }
      } else {
        setStatus({ type: 'IDLE', message: 'No match found. Please position your face clearly.' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AI Recognition Error:', error);
      toast({ variant: 'destructive', title: 'An Error Occurred', description: 'AI recognition failed. Retrying...' });
      setStatus({ type: 'IDLE', message: 'An error occurred. Retrying automatically.' });
      setIsLoading(false);
    }
  };

  // Camera and scanning loop management
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
        setStatus({ type: 'IDLE', message: 'Ready to scan. Position your face in the frame.' });
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsCameraOn(false);
        setStatus({ type: 'ERROR', message: 'Camera access denied. Please enable it in browser settings.' });
      }
    };
    startCamera();

    // Cleanup function when navigating away
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // Automatic scanning loop, driven by setTimeout for better control
  useEffect(() => {
      let scanTimeout: NodeJS.Timeout;
      
      const loop = () => {
          if (document.visibilityState === 'visible') { // Only scan if the page is visible
            handleScan();
          }
      };

      if (status.type === 'IDLE' && isCameraOn) {
          scanTimeout = setTimeout(loop, SCAN_INTERVAL);
      }

      return () => {
          clearTimeout(scanTimeout);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.type, isCameraOn]);


  const StatusIcon = () => {
    switch (status.type) {
      case 'SCANNING': return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
      case 'COOLDOWN':
        return <UserCheck className="h-6 w-6 text-green-500" />;
      case 'NO_MATCH': return <UserX className="h-6 w-6 text-destructive" />;
      case 'ERROR': return <ShieldAlert className="h-6 w-6 text-destructive" />;
      case 'IDLE':
      default:
        return <Camera className="h-6 w-6 text-muted-foreground" />;
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
              {!isCameraOn && status.type === 'ERROR' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                    <Camera className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-bold">Camera Access Denied</h3>
                    <p>Please enable camera permissions in your browser settings to use the kiosk.</p>
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
                {status.type === 'COOLDOWN' && <Progress value={status.progress} className="w-full mt-2 h-2" />}
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
                    attendance.sort((a,b) => (b.inTime ?? '').localeCompare(a.inTime ?? '')).map(record => (
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
