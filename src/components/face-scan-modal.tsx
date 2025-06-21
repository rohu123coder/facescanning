'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { faceScanAttendance } from '@/ai/flows/face-scan-attendance';
import type { Staff } from '@/lib/data';
import { Loader2, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface FaceScanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staffMember: Staff | null;
}

export function FaceScanModal({ isOpen, onOpenChange, staffMember }: FaceScanModalProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!isOpen) return;

      setPhotoPreview(null);
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
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!photoPreview || !staffMember) return;

    setIsLoading(true);

    try {
      const result = await faceScanAttendance({
        photoDataUri: photoPreview,
        staffId: staffMember.id,
      });

      if (result.isRecognized) {
        toast({
          title: 'Attendance Logged',
          description: `${staffMember.name}'s attendance has been successfully logged.`,
        });
      } else {
        toast({
          title: 'Recognition Failed',
          description: result.message || `Could not recognize ${staffMember.name}. Please try again.`,
          variant: 'destructive',
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during face scan.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };
  
  const handleRetake = () => {
    setPhotoPreview(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Face Scan Attendance</DialogTitle>
          <DialogDescription>
            Center {staffMember?.name}'s face in the frame and capture a photo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative flex items-center justify-center w-full aspect-video rounded-md bg-muted overflow-hidden border">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Face preview"
                fill
                className="object-cover"
              />
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  playsInline 
                  data-testid="video-feed"
                />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <AlertTitle className="font-bold">Camera Access Denied</AlertTitle>
                        <AlertDescription className="text-sm">
                            Please enable camera permissions in your browser settings to use this feature.
                        </AlertDescription>
                    </div>
                )}
                 {hasCameraPermission === null && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Requesting camera...</p>
                    </div>
                 )}
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {photoPreview ? (
            <>
              <Button variant="secondary" onClick={handleRetake} disabled={isLoading}>
                <RefreshCw className="mr-2" />
                Retake
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Log Attendance'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleCapture} disabled={!hasCameraPermission || isLoading}>
              <Camera className="mr-2" />
              Capture Photo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
