'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Staff } from '@/lib/data';
import { Loader2, Camera, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddStaffModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStaffAdded: (staff: Omit<Staff, 'id' | 'attendanceStatus'>) => void;
}

const staffFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  whatsapp: z.string().min(10, { message: 'WhatsApp number must be at least 10 digits.' }),
  address: z.string().min(5, { message: 'Please enter a valid address.' }),
  department: z.string().min(2, { message: 'Department is required.' }),
  role: z.string().min(2, { message: 'Role is required.' }),
  salary: z.coerce.number().min(0, { message: 'Salary must be a positive number.' }),
  photo: z.string().min(1, { message: 'A valid staff photo is required.' }),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export function AddStaffModal({ isOpen, onOpenChange, onStaffAdded }: AddStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      whatsapp: '',
      address: '',
      department: '',
      role: '',
      salary: 0,
      photo: '',
    },
  });

  const photoValue = form.watch('photo');

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    stopCameraStream();
    form.reset();
    setActiveTab('url');
    setHasCameraPermission(null);
    onOpenChange(false);
  }, [isLoading, stopCameraStream, form, onOpenChange]);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    
    if (isOpen && activeTab === 'camera') {
      getCameraPermission();
    } else {
      stopCameraStream();
    }
    
    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, stopCameraStream]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        form.setValue('photo', dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        form.setValue('photo', dataUri, { shouldValidate: true });
        stopCameraStream();
      }
    }
  };

  const onSubmit = async (values: StaffFormValues) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onStaffAdded({
        ...values,
        photoUrl: values.photo,
      });
      toast({
        title: 'Staff Added',
        description: `${values.name} has been successfully added to the staff list.`,
      });
      handleClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add staff member. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee and provide a photo for facial recognition.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-2">
            <Form {...form}>
            <form id="add-staff-form" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Aarav Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="e.g. aarav.sharma@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. +919876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. +919876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Enter full address" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Frontend Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Salary (INR)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g. 75000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Staff Photo</FormLabel>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="url"><LinkIcon className="mr-1" /> URL</TabsTrigger>
                        <TabsTrigger value="upload"><Upload className="mr-1" /> Upload</TabsTrigger>
                        <TabsTrigger value="camera"><Camera className="mr-1" /> Camera</TabsTrigger>
                        </TabsList>
                        <TabsContent value="url">
                        <FormControl>
                            <Input 
                            placeholder="https://placehold.co/400x400.png" 
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value?.startsWith('http') ? field.value : ''}
                            />
                        </FormControl>
                        </TabsContent>
                        <TabsContent value="upload">
                            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2"/> Select File
                            </Button>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            </FormControl>
                        </TabsContent>
                        <TabsContent value="camera">
                        <div className="space-y-2">
                            {hasCameraPermission === false ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>
                                Please enable camera permissions to use this feature.
                                </AlertDescription>
                            </Alert>
                            ) : (
                            <>
                            <div className="w-full aspect-video rounded-md bg-muted overflow-hidden border relative">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                {hasCameraPermission === null && <p className="absolute inset-0 flex items-center justify-center text-muted-foreground">Initializing camera...</p>}
                            </div>
                            <Button type="button" className="w-full" onClick={handleTakePhoto} disabled={!hasCameraPermission}>
                                <Camera className="mr-2" /> Take Photo
                            </Button>
                            </>
                            )}
                        </div>
                        </TabsContent>
                    </Tabs>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {photoValue && (
                    <div className="col-span-2 space-y-2">
                        <Label>Photo Preview</Label>
                        <div className="w-full flex justify-center p-2 border rounded-md bg-muted">
                            <Image
                                src={photoValue}
                                alt="Staff photo preview"
                                width={128}
                                height={128}
                                className="rounded-md object-cover aspect-square"
                                data-ai-hint="person portrait"
                            />
                        </div>
                    </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
                
            </form>
            </Form>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" form="add-staff-form" disabled={isLoading}>
            {isLoading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
                </>
            ) : (
                'Save Staff'
            )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}