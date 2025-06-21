'use client';

import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Staff } from '@/lib/data';
import { Loader2 } from 'lucide-react';

interface AddStaffModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStaffAdded: (staff: Omit<Staff, 'id'>) => void;
}

const staffFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  department: z.string().min(2, { message: 'Department is required.' }),
  role: z.string().min(2, { message: 'Role is required.' }),
  salary: z.coerce.number().min(0, { message: 'Salary must be a positive number.' }),
});

export function AddStaffModal({ isOpen, onOpenChange, onStaffAdded }: AddStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      department: '',
      role: '',
      salary: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof staffFormSchema>) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call.
      // Here we'll just simulate a delay.
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onStaffAdded(values);
      toast({
        title: 'Staff Added',
        description: `${values.name} has been successfully added to the staff list.`,
      });
      form.reset();
      onOpenChange(false);
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
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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
                <FormItem>
                  <FormLabel>Salary (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 75000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
               <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                  Cancel
               </Button>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Staff'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
