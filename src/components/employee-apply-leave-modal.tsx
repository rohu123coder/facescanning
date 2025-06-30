
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';

interface EmployeeApplyLeaveModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const leaveFormSchema = z.object({
  leaveType: z.enum(['Casual', 'Sick']),
  dateRange: z.object({
    from: z.date({ required_error: 'Please select a start date.' }),
    to: z.date().optional(),
  }),
  reason: z.string().min(10, 'Please provide a reason for the leave (min 10 characters).'),
});

export function EmployeeApplyLeaveModal({ isOpen, onOpenChange }: EmployeeApplyLeaveModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addRequest } = useLeaveStore();
  const { employee } = useEmployeeAuthStore();

  const form = useForm<z.infer<typeof leaveFormSchema>>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: 'Casual',
      dateRange: {
        from: new Date(),
        to: new Date()
      },
      reason: ''
    },
  });

  const onSubmit = (values: z.infer<typeof leaveFormSchema>) => {
    if (!employee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find employee information.' });
        return;
    }

    setIsLoading(true);
    const { leaveType, dateRange, reason } = values;
    
    addRequest({
      staffId: employee.id,
      leaveType,
      startDate: dateRange.from.toISOString(),
      endDate: (dateRange.to || dateRange.from).toISOString(),
      reason,
    });
    
    toast({ title: 'Request Submitted', description: 'Your leave request has been sent for approval.' });
    handleClose();
    setIsLoading(false);
  };
  
  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>Submit your leave request. It will be sent to the admin for approval.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Leave Dates</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !field.value.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value.from ? 
                          (field.value.to ? `${format(field.value.from, "PPP")} - ${format(field.value.to, "PPP")}` : format(field.value.from, "PPP"))
                          : <span>Pick a date range</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={field.value}
                        onSelect={field.onChange as (range: DateRange | undefined) => void}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly explain the reason for leave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin"/> : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
