
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
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { type Staff } from '@/lib/data';
import { Loader2, Camera, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { PhotoCaptureModal } from './photo-capture-modal';

interface EditStaffModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staff: Staff | null;
}

const staffFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  whatsapp: z.string().min(10, 'WhatsApp number must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  department: z.enum(['Sales', 'Marketing', 'Engineering', 'HR', 'Support']),
  role: z.string().min(2, 'Role is required'),
  salary: z.coerce.number().min(0, 'Salary must be a positive number'),
  annualCasualLeaves: z.coerce.number().int().min(0, 'Must be a positive number'),
  annualSickLeaves: z.coerce.number().int().min(0, 'Must be a positive number'),
  photoUrl: z.string().min(1, 'A photo is required for facial recognition.'),
  status: z.enum(['Active', 'Inactive']),
});

export function EditStaffModal({ isOpen, onOpenChange, staff }: EditStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const { toast } = useToast();
  const { updateStaff } = useStaffStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      whatsapp: '',
      address: '',
      department: 'Engineering',
      role: '',
      salary: 0,
      annualCasualLeaves: 0,
      annualSickLeaves: 0,
      photoUrl: '',
      status: 'Active',
    },
  });
  
  useEffect(() => {
    if (staff) {
        form.reset(staff);
    }
  }, [staff, form, isOpen]);

  const photoUrlValue = form.watch('photoUrl');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const compressedDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            if (!e.target?.result) return reject(new Error('File reading failed'));
            const img = document.createElement('img');
            img.src = e.target.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxWidth = 400;
              const scaleSize = maxWidth / img.width;
              canvas.width = maxWidth;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject(new Error('Canvas context failed'));
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(ctx.canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
          };
          reader.onerror = reject;
        });
        form.setValue('photoUrl', compressedDataUri, { shouldValidate: true });
      } catch (error) {
        console.error("Image compression error", error);
        toast({
          variant: 'destructive',
          title: 'Image Error',
          description: 'Could not process the image. Please try another one.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handlePhotoCaptured = (dataUri: string) => {
    form.setValue('photoUrl', dataUri, { shouldValidate: true });
  };


  const onSubmit = async (values: z.infer<typeof staffFormSchema>) => {
    if (!staff) return;
    setIsLoading(true);
    try {
      updateStaff({
        ...staff,
        ...values,
      });
      toast({
        title: 'Staff Updated',
        description: `${values.name}'s details have been updated.`,
      });
      handleClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update staff.' });
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
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>Update the details for the staff member.</DialogDescription>
        </DialogHeader>
        {staff && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[65vh] pr-6">
              <div className="space-y-4 py-4">
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
                          <div className='space-y-2'>
                             <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsPhotoModalOpen(true)} disabled={isLoading}>
                                  <Camera className="mr-2"/> Take Photo
                                </Button>
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                     {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>} Upload
                                </Button>
                             </div>
                              <Input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                            <FormControl>
                                <Input placeholder="Or paste image URL" {...field} />
                            </FormControl>
                          </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="mobile" render={({ field }) => (
                        <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
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
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem><FormLabel>Role/Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="salary" render={({ field }) => (
                        <FormItem><FormLabel>Monthly Salary (Gross)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="annualCasualLeaves" render={({ field }) => (
                        <FormItem><FormLabel>Annual Casual Leaves</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="annualSickLeaves" render={({ field }) => (
                        <FormItem><FormLabel>Annual Sick Leaves</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
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
