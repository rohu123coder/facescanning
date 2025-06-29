
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format, differenceInDays } from 'date-fns';
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
import { Loader2, CalendarIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import type { Staff } from '@/lib/data';

interface EmployeeApplyLeaveModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employee: Staff;
}

const leaveFormSchema = z.object({
  leaveType: z.enum(['Casual', 'Sick']),
  dateRange: z.object({
    from: z.date({required_error: "Start date is required"}),
    to: z.date().optional(),
  }),
  reason: z.string().min(10, 'Please provide a reason for the leave.'),
});

export function EmployeeApplyLeaveModal({ isOpen, onOpenChange, employee }: EmployeeApplyLeaveModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addRequest } = useLeaveStore();

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

  const selectedLeaveType = form.watch('leaveType');
  const remainingLeaves = selectedLeaveType === 'Casual' ? employee.annualCasualLeaves : employee.annualSickLeaves;

  const onSubmit = (values: z.infer<typeof leaveFormSchema>) => {
    setIsLoading(true);
    const { leaveType, dateRange, reason } = values;

    const leaveDays = differenceInDays(dateRange.to || dateRange.from, dateRange.from) + 1;
    if (leaveDays > remainingLeaves) {
        toast({
            variant: 'destructive',
            title: 'Not Enough Leave Balance',
            description: `You only have ${remainingLeaves} ${leaveType} leave(s) remaining.`
        });
        setIsLoading(false);
        return;
    }

    addRequest({
      staffId: employee.id,
      leaveType,
      startDate: dateRange.from.toISOString(),
      endDate: (dateRange.to || dateRange.from).toISOString(),
      reason,
    });
    
    toast({ title: 'Leave Request Submitted', description: 'Your leave request has been submitted for approval.' });
    
    // Dispatch event for client notification
    window.dispatchEvent(new CustomEvent('new-leave-request', { 
        detail: { staffName: employee.name, leaveType: leaveType } 
    }));
    
    handleClose();
    setIsLoading(false);
  };
  
  const handleClose = () => {
    if (isLoading) return;
    form.reset({
        leaveType: 'Casual',
        dateRange: { from: new Date(), to: new Date() },
        reason: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>Submit your leave request for approval.</DialogDescription>
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
                      <SelectItem value="Casual">Casual ({employee.annualCasualLeaves} remaining)</SelectItem>
                      <SelectItem value="Sick">Sick ({employee.annualSickLeaves} remaining)</SelectItem>
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
