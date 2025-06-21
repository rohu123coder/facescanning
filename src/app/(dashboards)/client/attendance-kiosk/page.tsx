
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { faceScanAttendance } from '@/ai/flows/face-scan-attendance';
import { AlertCircle, Video, VideoOff, UserCheck } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LogEntry = {
  id: number;
  message: string;
  timestamp: string;
  staffName: string;
  staffPhotoUrl: string;
};

export default function AttendanceKiosk() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanLogs, setScanLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  const { staffList, updateStaffAttendance, isInitialized } = useStaffStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTimesRef = useRef(new Map<string, number>());
  const scanCooldown = 1000 * 60 * 5; // 5 minutes cooldown per person

  const addLog = useCallback((message: string, staffName: string, staffPhotoUrl: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      message,
      staffName,
      staffPhotoUrl,
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
    if (!videoRef.current || !canvasRef.current || !isInitialized || staffList.length === 0) return;
    
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

    for (const staff of staffList) {
      const lastScan = lastScanTimesRef.current.get(staff.id) || 0;
      if (now - lastScan < scanCooldown) {
        continue; // This person is on cooldown
      }

      try {
        const result = await faceScanAttendance({
          photoDataUri: dataUri,
          staffId: staff.id,
          referencePhotoUrl: staff.photoUrl,
        });

        if (result.isRecognized) {
          lastScanTimesRef.current.set(staff.id, now);
          const statusMsg = updateStaffAttendance(staff.id);
          toast({ title: `Attendance Logged`, description: `${staff.name} has ${statusMsg.toLowerCase()}.` });
          addLog(statusMsg, staff.name, staff.photoUrl);
          return; 
        }
      } catch (error) {
        console.error(`Face scan API error for ${staff.name}:`, error);
      }
    }
  }, [staffList, isInitialized, updateStaffAttendance, toast, scanCooldown, addLog]);


  const startScanning = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsScanning(true);
    intervalRef.current = setInterval(handleScanFrame, 2500); // Scan every 2.5 seconds
  }, [handleScanFrame]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream = cameraStream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      stopScanning();
      if (videoRef.current && videoRef.current.srcObject) {
        const streamFromRef = videoRef.current.srcObject as MediaStream;
        streamFromRef.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopScanning, toast]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-8 p-1">
      <Card className="md:w-2/3 flex flex-col">
        <CardHeader>
          <CardTitle>Attendance Kiosk</CardTitle>
          <CardDescription>The camera is active. Employees can clock in or out by facing the camera.</CardDescription>
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
             <div className="mt-4">
                {!isScanning ? (
                    <Button size="lg" onClick={startScanning} disabled={hasCameraPermission !== true}>
                        <Video className="mr-2"/> Start Scanning
                    </Button>
                ) : (
                    <Button size="lg" variant="destructive" onClick={stopScanning}>
                        <VideoOff className="mr-2" /> Stop Scanning
                    </Button>
                )}
             </div>
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
                    <p>No activity yet. Start scanning.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pr-4">
                    {scanLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={log.staffPhotoUrl} alt={log.staffName} data-ai-hint="person portrait" />
                          <AvatarFallback>{log.staffName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <p className="font-semibold">{log.staffName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserCheck className="text-green-500" />
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
