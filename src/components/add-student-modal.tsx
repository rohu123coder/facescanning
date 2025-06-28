
'use client';

import { useState, useRef } from 'react';
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
import { useStudentStore } from '@/hooks/use-student-store';
import { Loader2, Camera, Upload, CalendarIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PhotoCaptureModal } from './photo-capture-modal';


interface AddStudentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  className: z.string().min(1, { message: 'Class name is required.' }),
  rollNumber: z.string().min(1, { message: 'Roll number is required.' }),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.date({ required_error: 'Date of birth is required.' }),
  religion: z.string().min(2, { message: 'Religion is required.' }),
  fatherName: z.string().min(2, { message: 'Father\'s name is required.' }),
  motherName: z.string().min(2, { message: 'Mother\'s name is required.' }),
  parentMobile: z.string().min(10, { message: 'Parent mobile number is required.' }),
  parentWhatsapp: z.string().min(10, { message: 'Parent WhatsApp number is required.' }),
  photoUrl: z.string().min(1, { message: 'A photo is required for facial recognition.' }),
});

export function AddStudentModal({ isOpen, onOpenChange }: AddStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const { toast } = useToast();
  const { addStudent } = useStudentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  
  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      className: '',
      rollNumber: '',
      gender: 'Male',
      religion: '',
      fatherName: '',
      motherName: '',
      parentMobile: '',
      parentWhatsapp: '',
      photoUrl: '',
    },
  });

  const photoUrlValue = form.watch('photoUrl');

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
  
  const handlePhotoCaptured = (dataUri: string) => {
    form.setValue('photoUrl', dataUri, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      addStudent({
        ...values,
        dob: values.dob.toISOString(),
        joiningDate: new Date().toISOString(),
        status: 'Active',
      });
      toast({
        title: 'Student Added',
        description: `${values.name} has been added successfully.`,
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

  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Student</DialogTitle>
          <DialogDescription>
            Enter the details for the new student.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[65vh] pr-6">
              <div className="space-y-4 py-4">
                 <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Photo</FormLabel>
                      <div className="flex items-center gap-4">
                          <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                              {photoUrlValue ? (
                                  <Image src={photoUrlValue} alt="Student Preview" width={96} height={96} className="object-contain rounded-md" data-ai-hint="person portrait" />
                              ) : (
                                  <Camera className="w-8 h-8 text-muted-foreground" />
                              )}
                          </div>
                          <div className='space-y-2'>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsPhotoModalOpen(true)}>
                                  <Camera className="mr-2"/> Take Photo
                                </Button>
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                      <Upload className="mr-2"/> Upload
                                </Button>
                              </div>
                              <Input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                            <FormControl>
                                <Input placeholder="Or paste image URL" value={field.value ?? ''} onChange={field.onChange} />
                            </FormControl>
                          </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      name="className"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 10 A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="rollNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roll Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 21" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={currentYear - 100}
                              toYear={currentYear}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="religion"
                      render={({ field }) => (
                        <FormItem>
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="e.g. aarav.sharma@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Manish Sharma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="motherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mother's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Sunita Sharma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="parentMobile"
                      render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
                          <FormLabel>Parent's WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. +919876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Student'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     <PhotoCaptureModal 
        isOpen={isPhotoModalOpen}
        onOpenChange={setIsPhotoModalOpen}
        onPhotoCaptured={handlePhotoCaptured}
    />
    </>
  );
}
