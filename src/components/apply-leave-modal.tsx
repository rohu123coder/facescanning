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
import { useToast } from '@/hooks/use-toast';
import { type LeaveRequest } from '@/lib/data';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLeaveStore } from '@/hooks/use-leave-store';
import { type DateRange } from 'react-day-picker';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employeeId: string;
}

const applyLeaveSchema = z.object({
  leaveType: z.enum(['Casual', 'Sick'], { required_error: 'Please select a leave type.' }),
  dates: z.object({
      from: z.date({ required_error: 'A start date is required.' }),
      to: z.date({ required_error: 'An end date is required.' }),
  }),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters.' }),
});

export function ApplyLeaveModal({ isOpen, onOpenChange, employeeId }: ApplyLeaveModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { addLeaveRequest } = useLeaveStore();

  const form = useForm<z.infer<typeof applyLeaveSchema>>({
    resolver: zodResolver(applyLeaveSchema),
  });

  const onSubmit = async (values: z.infer<typeof applyLeaveSchema>) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      addLeaveRequest({
          employeeId: employeeId,
          leaveType: values.leaveType,
          startDate: values.dates.from.toISOString(),
          endDate: values.dates.to.toISOString(),
          reason: values.reason,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Apply for Leave</DialogTitle>
          <DialogDescription>
            Submit your leave request for approval.
          </DialogDescription>
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
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Casual">Casual Leave</SelectItem>
                            <SelectItem value="Sick">Sick Leave</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Dates</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                                field.value.to ? (
                                <>
                                    {format(field.value.from, "LLL dd, y")} -{" "}
                                    {format(field.value.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(field.value.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value?.from}
                            selected={field.value as DateRange}
                            onSelect={field.onChange}
                            numberOfMonths={1}
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
                  <FormLabel>Reason for Leave</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Please provide a reason for your leave..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={handleClose} type="button" disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (<><Loader2 className="mr-2 animate-spin" /> Submitting...</>) : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
