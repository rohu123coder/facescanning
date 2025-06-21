'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { faceScanAttendance } from '@/ai/flows/face-scan-attendance';
import type { Staff } from '@/lib/data';
import { Loader2, Camera, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface FaceScanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staffMember: Staff | null;
  onAttendanceSuccess: (staffId: string) => void;
}

export function FaceScanModal({ isOpen, onOpenChange, staffMember, onAttendanceSuccess }: FaceScanModalProps) {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failure' | 'no-permission'>('idle');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 5;

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    attemptsRef.current = 0;
  }, []);

  const handleClose = useCallback(() => {
    stopScanning();
    setScanStatus('idle');
    onOpenChange(false);
  }, [onOpenChange, stopScanning]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopScanning();
    };

    const getCameraPermission = async () => {
      if (!isOpen) {
        cleanup();
        return;
      }

      setScanStatus('idle');
      setHasCameraPermission(null);

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setScanStatus('no-permission');
      }
    };

    getCameraPermission();

    return cleanup;
  }, [isOpen, stopScanning]);


  useEffect(() => {
    if (isOpen && hasCameraPermission && scanStatus === 'idle') {
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current || !staffMember) {
            return;
        }
        
        if (scanStatus !== 'idle' && scanStatus !== 'scanning') {
            stopScanning();
            return;
        }

        if (attemptsRef.current >= maxAttempts) {
            setScanStatus('failure');
            stopScanning();
            return;
        }

        setScanStatus('scanning');
        attemptsRef.current += 1;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await faceScanAttendance({
                photoDataUri: dataUri,
                staffId: staffMember.id,
                referencePhotoUrl: staffMember.photoUrl,
            });

            if (result.isRecognized) {
                setScanStatus('success');
                stopScanning();
                onAttendanceSuccess(staffMember.id);
                toast({
                    title: 'Attendance Logged',
                    description: `${staffMember.name}'s attendance logged at ${new Date().toLocaleTimeString()}.`,
                });
                setTimeout(() => handleClose(), 2000);
            } else {
                if (attemptsRef.current < maxAttempts) {
                    setScanStatus('idle'); 
                }
            }
        } catch (error) {
            console.error("Face scan API error:", error);
            if (attemptsRef.current < maxAttempts) {
                setScanStatus('idle');
            } else {
                setScanStatus('failure');
                stopScanning();
            }
        }
      }, 2500);
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, hasCameraPermission, staffMember, onAttendanceSuccess, toast, stopScanning, handleClose, scanStatus]);

  const getStatusOverlay = () => {
     switch(scanStatus) {
        case 'scanning':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center z-10">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p className="font-bold text-lg">Scanning...</p>
                    <p className="text-sm">Attempt {attemptsRef.current} of {maxAttempts}. Please hold still.</p>
                </div>
            )
        case 'success':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/90 text-white p-4 text-center z-10">
                    <CheckCircle className="h-16 w-16 mb-4" />
                    <p className="font-bold text-xl">Welcome, {staffMember?.name}!</p>
                    <p>Attendance logged successfully.</p>
                </div>
            )
        case 'failure':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/90 text-white p-4 text-center z-10">
                    <XCircle className="h-16 w-16 mb-4" />
                    <p className="font-bold text-xl">Recognition Failed</p>
                    <p className="text-sm">Could not verify identity. Closing now.</p>
                </div>
            )
        case 'no-permission':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center z-10">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <AlertTitle className="font-bold">Camera Access Denied</AlertTitle>
                    <AlertDescription className="text-sm">
                        Please enable camera permissions in your browser settings to use this feature.
                    </AlertDescription>
                </div>
            )
        case 'idle':
             if (hasCameraPermission === null) {
                 return (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Initializing Camera...</p>
                    </div>
                 )
             } else if (hasCameraPermission === true) {
                 return (
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        Ready to scan
                    </div>
                 )
             }
             return null;
        default:
            return null;
    }
  }

  useEffect(() => {
    if (scanStatus === 'failure') {
      setTimeout(() => handleClose(), 2500);
    }
  }, [scanStatus, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Real-time Attendance Scan</DialogTitle>
          <DialogDescription>
            The system will automatically scan for {staffMember?.name}'s face.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative flex items-center justify-center w-full aspect-video rounded-md bg-muted overflow-hidden border">
             <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                playsInline 
                data-testid="video-feed"
             />
             {getStatusOverlay()}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
