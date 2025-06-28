'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStaffStore } from '@/hooks/use-staff-store';
import { recognizeStaffFace } from '@/ai/flows/face-scan-attendance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { type Staff, type Attendance } from '@/lib/data';

const getAttendanceStoreKey = (clientId: string | undefined) => {
    if (!clientId) return null;
    const today = format(new Date(), 'yyyy-MM-dd');
    return `attendance_${clientId}_${today}`;
};

export default function AttendanceKioskPage() {
  const { staff, isInitialized: isStaffInitialized } = useStaffStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const { currentClient } = useClientStore(); // Assuming a useClientStore hook exists
  const storeKey = getAttendanceStoreKey(currentClient?.id);

  useEffect(() => {
    if (storeKey) {
      const storedAttendance = localStorage.getItem(storeKey);
      if (storedAttendance) {
        setAttendance(JSON.parse(storedAttendance));
      }
    }
  }, [storeKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'EEEE, MMMM d, yyyy, h:mm:ss a'));
    }, 1000);

    return () => {
      clearInterval(timer);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
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

  const toggleCamera = async () => {
    if (isCameraOn) {
      setIsCameraOn(false);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }
  };

  const handleScan = async () => {
    if (!isCameraOn || !videoRef.current || !canvasRef.current) {
      toast({ variant: 'destructive', title: 'Camera is off', description: 'Please turn on the camera to scan.' });
      return;
    }
    if (!isStaffInitialized || staff.length === 0) {
      toast({ variant: 'destructive', title: 'No Staff Data', description: 'Please add staff members before marking attendance.' });
      return;
    }

    setIsLoading(true);

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
          toast({
            title: `Attendance Marked: ${punchType === 'in' ? 'Clock In' : 'Clock Out'}`,
            description: `${punchType === 'in' ? 'Welcome' : 'Goodbye'}, ${matchedStaff.name}! Your attendance for ${format(new Date(), 'PP')} has been recorded.`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Recognition Failed',
          description: 'Could not identify staff member. Please try again.',
        });
      }
    } catch (error) {
      console.error('AI Recognition Error:', error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Something went wrong during face recognition.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Attendance Kiosk</h1>
        <p className="text-muted-foreground">{currentTime}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">AI Face Scan</CardTitle>
            <CardDescription>Position your face in the frame and scan to mark your attendance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
              <video ref={videoRef} className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`} autoPlay muted playsInline />
              {!isCameraOn && <Camera className="h-16 w-16 text-muted-foreground" />}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access in your browser settings to use this feature.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={toggleCamera} variant="outline" className="w-full">
                {isCameraOn ? <VideoOff className="mr-2" /> : <Video className="mr-2" />}
                {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              </Button>
              <Button onClick={handleScan} disabled={isLoading || !isCameraOn} className="w-full">
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
                Scan Face & Mark Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Today's Attendance Log</CardTitle>
            <CardDescription>Live log of staff clock-ins and clock-outs for {format(new Date(), 'PP')}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
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
                    attendance.sort((a,b) => (a.inTime ?? '').localeCompare(b.inTime ?? '')).map(record => (
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
