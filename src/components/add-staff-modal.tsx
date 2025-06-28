'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Staff } from '@/lib/data';
import { Loader2, Camera, Upload, Link as LinkIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AddStaffModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStaffAdded: (staff: Omit<Staff, 'id'>) => void;
  existingStaffCount: number;
}

const staffFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  mobile: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  whatsapp: z.string().min(10, { message: 'Please enter a valid WhatsApp number.' }),
  address: z.string().min(10, { message: 'Please enter a detailed address.' }),
  department: z.enum(['Sales', 'Marketing', 'Engineering', 'HR', 'Support'], { required_error: 'Please select a department.' }),
  role: z.string().min(2, { message: 'Role is required.' }),
  salary: z.coerce.number().min(0, { message: 'Salary must be a positive number.' }),
  annualCasualLeaves: z.coerce.number().min(0),
  annualSickLeaves: z.coerce.number().min(0),
  photoUrl: z.string().min(1, { message: 'A photo is required for facial recognition.' }),
});

export function AddStaffModal({ isOpen, onOpenChange, onStaffAdded }: AddStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      whatsapp: '',
      address: '',
      role: '',
      salary: 0,
      annualCasualLeaves: 12,
      annualSickLeaves: 10,
      photoUrl: '',
    },
  });

  const photoUrlValue = form.watch('photoUrl');

  useEffect(() => {
    // Cleanup camera stream on component unmount or modal close
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCameraAccess = async () => {
    if (isCameraOn) {
      setIsCameraOn(false);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsCameraOn(true);
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

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/png');
      form.setValue('photoUrl', dataUri, { shouldValidate: true });
      handleCameraAccess(); // Turn off camera after capture
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        form.setValue('photoUrl', dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof staffFormSchema>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onStaffAdded({
        ...values,
        joiningDate: new Date().toISOString(),
        status: 'Active',
      });
      toast({
        title: 'Staff Member Added',
        description: `${values.name} has been added to your team.`,
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

  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    setIsCameraOn(false);
    if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }
    setHasCameraPermission(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee and provide a photo for facial recognition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[65vh] pr-6">
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Aarav Sharma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +919876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
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
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Engineering">Engineering</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role / Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annualCasualLeaves"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Casual Leaves</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annualSickLeaves"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Sick Leaves</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Photo</FormLabel>
                      <div className="flex items-center gap-4">
                          <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                              {photoUrlValue ? (
                                  <Image src={photoUrlValue} alt="Staff Preview" width={96} height={96} className="object-contain rounded-md" data-ai-hint="person portrait" />
                              ) : (
                                  <Camera className="w-8 h-8 text-muted-foreground" />
                              )}
                          </div>
                           <Tabs defaultValue="upload" className="w-full">
                            <TabsList className='grid w-full grid-cols-3'>
                                <TabsTrigger value="upload"><Upload className="mr-2" />Upload</TabsTrigger>
                                <TabsTrigger value="camera"><Camera className="mr-2" />Camera</TabsTrigger>
                                <TabsTrigger value="url"><LinkIcon className="mr-2" />URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-4">
                               <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2"/> Select Image
                                </Button>
                               <Input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            </TabsContent>
                            <TabsContent value="camera" className="mt-4">
                                <div className="space-y-2">
                                    <video ref={videoRef} className={`w-full aspect-video rounded-md bg-muted ${isCameraOn ? 'block' : 'hidden'}`} autoPlay muted playsInline />
                                    {isCameraOn && <Button type="button" onClick={handleCapture} className="w-full">Capture Photo</Button>}
                                    <Button type="button" onClick={handleCameraAccess} variant="outline" className="w-full">
                                        <Camera className="mr-2" /> {isCameraOn ? 'Close Camera' : 'Open Camera'}
                                    </Button>
                                    <canvas ref={canvasRef} className="hidden" />
                                     {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                          <AlertTitle>Camera Access Required</AlertTitle>
                                          <AlertDescription>
                                            Please allow camera access to use this feature.
                                          </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="url" className="mt-4">
                                <FormControl>
                                  <Input placeholder="https://example.com/photo.jpg" value={field.value ?? ''} onChange={field.onChange} />
                                </FormControl>
                            </TabsContent>
                           </Tabs>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Staff'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
