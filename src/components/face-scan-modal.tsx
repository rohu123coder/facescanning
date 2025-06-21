'use client';

import { useState, type ChangeEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { faceScanAttendance } from '@/ai/flows/face-scan-attendance';
import type { Staff } from '@/lib/data';
import { Loader2, UserCheck, UserX, Camera } from 'lucide-react';

interface FaceScanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staffMember: Staff | null;
}

export function FaceScanModal({ isOpen, onOpenChange, staffMember }: FaceScanModalProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !staffMember) return;

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(photo);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const result = await faceScanAttendance({
          photoDataUri: base64data,
          staffId: staffMember.id,
        });

        if (result.isRecognized) {
          toast({
            title: 'Attendance Logged',
            description: `${staffMember.name}'s attendance has been successfully logged.`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Recognition Failed',
            description: `Could not recognize ${staffMember.name}. Please try again.`,
            variant: 'destructive',
          });
        }
        onOpenChange(false);
        setPhoto(null);
        setPhotoPreview(null);
      };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Face Scan Attendance</DialogTitle>
          <DialogDescription>
            Upload a photo of {staffMember?.name} to log their attendance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center w-full">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Face preview"
                width={200}
                height={200}
                className="rounded-full object-cover w-[200px] h-[200px] border-4 border-primary/50 shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-[200px] h-[200px] rounded-full bg-muted border-2 border-dashed">
                <Camera className="h-16 w-16 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Photo Preview</p>
              </div>
            )}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!photo || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Log Attendance'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
