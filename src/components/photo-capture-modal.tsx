
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPhotoCaptured: (dataUri: string) => void;
}

export function PhotoCaptureModal({ isOpen, onOpenChange, onPhotoCaptured }: PhotoCaptureModalProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
  
  const startCamera = useCallback(async () => {
      setHasCameraPermission(null);
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
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
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        onPhotoCaptured(dataUri);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capture Photo</DialogTitle>
          <DialogDescription>Position the face within the frame and click capture.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 className="h-16 w-16 mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Starting camera...</p>
                </div>
            )}
             {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                    <CameraOff className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-bold">Camera Access Denied</h3>
                    <p>Please enable camera permissions in your browser settings and try again.</p>
                </div>
            )}
          </div>
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCapture} disabled={!hasCameraPermission}>
            <Camera className="mr-2" /> Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
