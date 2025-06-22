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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/lib/data';
import { Loader2, Camera, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddStudentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStudentAdded: (student: Omit<Student, 'id' | 'attendanceRecords'>) => void;
}

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  className: z.string().min(1, { message: 'Class is required.' }),
  rollNumber: z.string().min(1, { message: 'Roll number is required.' }),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select a gender.' }),
  dob: z.string().min(1, { message: 'Date of birth is required.' }),
  religion: z.string().min(2, { message: 'Religion is required.' }),
  fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
  motherName: z.string().min(2, { message: "Mother's name must be at least 2 characters." }),
  parentMobile: z.string().min(10, { message: 'Parent mobile number must be at least 10 digits.' }),
  parentWhatsapp: z.string().min(10, { message: 'Parent WhatsApp number must be at least 10 digits.' }),
  photo: z.string().min(1, { message: 'A valid student photo is required.' }),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export function AddStudentModal({ isOpen, onOpenChange, onStudentAdded }: AddStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      className: '',
      rollNumber: '',
      gender: undefined,
      dob: '',
      religion: '',
      fatherName: '',
      motherName: '',
      parentMobile: '',
      parentWhatsapp: '',
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

  const onSubmit = async (values: StudentFormValues) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onStudentAdded({
        ...values,
        photoUrl: values.photo,
      });
      toast({
        title: 'Student Added',
        description: `${values.name} has been successfully added to the student list.`,
      });
      handleClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add student. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline">Add New Student</DialogTitle>
          <DialogDescription>
            Enter the details for the new student and provide a photo for facial recognition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Priya Singh" {...field} />
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
                        <Input type="email" placeholder="e.g. priya.singh@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10th A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Hinduism" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rajesh Singh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Mother's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sunita Singh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentMobile"
                  render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                      <FormLabel>Parent's Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +919876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentWhatsapp"
                  render={({ field }) => (
                    <FormItem  className="col-span-2 sm:col-span-1">
                      <FormLabel>Parent's WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +919876543210" {...field} />
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
                      <FormLabel>Student Photo</FormLabel>
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
                        alt="Student photo preview"
                        width={128}
                        height={128}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="person portrait"
                      />
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
            <DialogFooter className="p-6 pt-4 border-t bg-background">
              <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Student'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
