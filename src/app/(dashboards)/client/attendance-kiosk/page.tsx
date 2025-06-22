'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { faceScanAttendance } from '@/ai/flows/face-scan-attendance';
import { AlertCircle, UserCheck, GraduationCap } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useStudentStore } from '@/hooks/use-student-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendAttendanceNotification } from '@/services/notification-service';

type Person = {
  id: string;
  name: string;
  photoUrl: string;
  type: 'Staff' | 'Student';
};

type LogEntry = {
  id: number;
  message: string;
  timestamp: string;
  personName: string;
  personPhotoUrl: string;
  personType: 'Staff' | 'Student';
};

export default function AttendanceKiosk() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanLogs, setScanLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  
  const { staffList, updateStaffAttendance, isInitialized: staffInitialized } = useStaffStore();
  const { studentList, updateStudentAttendance, isInitialized: studentInitialized } = useStudentStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTimesRef = useRef(new Map<string, number>());
  const isProcessingFrame = useRef(false);
  const scanCooldown = 1000 * 60 * 5; // 5 minutes cooldown per person

  const playBeep = useCallback(() => {
    if (typeof window === 'undefined') return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  }, []);

  const addLog = useCallback((message: string, person: Person) => {
    const newLog: LogEntry = {
      id: Date.now(),
      message,
      personName: person.name,
      personPhotoUrl: person.photoUrl,
      personType: person.type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setScanLogs(prev => [newLog, ...prev]);
  }, []);

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanFrame = useCallback(async () => {
    if (isProcessingFrame.current || !videoRef.current || !canvasRef.current || !staffInitialized || !studentInitialized) return;

    isProcessingFrame.current = true;
    try {
        const video = videoRef.current;
        if (video.readyState < video.HAVE_METADATA) return;

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        const now = Date.now();

        const allPeople: Person[] = [
          ...staffList.map(s => ({ ...s, type: 'Staff' as const })),
          ...studentList.map(s => ({ ...s, type: 'Student' as const }))
        ];

        for (const person of allPeople) {
          const lastScan = lastScanTimesRef.current.get(person.id) || 0;
          if (now - lastScan < scanCooldown) {
            continue;
          }

          try {
            const result = await faceScanAttendance({
              photoDataUri: dataUri,
              personId: person.id,
              referencePhotoUrl: person.photoUrl,
            });

            if (result.isRecognized) {
              lastScanTimesRef.current.set(person.id, now);
              
              let statusMsg = '';
              if (person.type === 'Staff') {
                statusMsg = updateStaffAttendance(person.id);
              } else {
                statusMsg = updateStudentAttendance(person.id);
              }
              
              toast({ title: `Attendance Logged`, description: `${person.name} has ${statusMsg.toLowerCase()}.` });
              playBeep();
              addLog(statusMsg, person);
              
              sendAttendanceNotification(person.id, person.name, statusMsg);

              return; 
            }
          } catch (error) {
            console.error(`Face scan API error for ${person.name}:`, error);
          }
        }
    } finally {
        isProcessingFrame.current = false;
    }
  }, [staffList, studentList, staffInitialized, studentInitialized, updateStaffAttendance, updateStudentAttendance, toast, scanCooldown, addLog, playBeep]);

  const startScanning = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScanning(true);
    if (typeof window !== 'undefined') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
    }
    intervalRef.current = setInterval(handleScanFrame, 2000);
  }, [handleScanFrame]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const initializeKiosk = async () => {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream = cameraStream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
           videoRef.current.onloadedmetadata = () => {
            startScanning();
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsScanning(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    initializeKiosk();

    return () => {
      stopScanning();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [startScanning, stopScanning, toast]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-8 p-1">
      <Card className="md:w-2/3 flex flex-col">
        <CardHeader>
          <CardTitle>Attendance Kiosk</CardTitle>
          <CardDescription>The attendance kiosk is now active. Scanning will begin automatically.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center relative">
            <div className="w-full aspect-video rounded-md bg-muted overflow-hidden border relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center z-10">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>
                        Please enable camera permissions in your browser settings.
                      </AlertDescription>
                    </Alert>
                </div>
              )}
              {isScanning && (
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                    SCANNING
                </div>
              )}
            </div>
             <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
      <Card className="md:w-1/3 flex flex-col">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Real-time log of attendance events.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
             <ScrollArea className="h-full">
                {scanLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No activity yet. Scanning for faces...</p>
                  </div>
                ) : (
                  <div className="space-y-4 pr-4">
                    {scanLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={log.personPhotoUrl} alt={log.personName} data-ai-hint="person portrait" />
                          <AvatarFallback>{log.personName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <p className="font-semibold">{log.personName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {log.personType === 'Student' ? <GraduationCap className="text-blue-500" /> : <UserCheck className="text-green-500" />}
                            <span>{log.message}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
             </ScrollArea>
          </CardContent>
      </Card>
    </div>
  );
}
