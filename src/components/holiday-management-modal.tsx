
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHolidayStore } from '@/hooks/use-holiday-store.tsx';
import { Loader2, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface HolidayManagementModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const holidayFormSchema = z.object({
  name: z.string().min(3, 'Holiday name is required'),
  date: z.date({ required_error: 'A date is required.' }),
});

export function HolidayManagementModal({ isOpen, onOpenChange }: HolidayManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { holidays, addHoliday, removeHoliday, isInitialized } = useHolidayStore();

  const form = useForm<z.infer<typeof holidayFormSchema>>({
    resolver: zodResolver(holidayFormSchema),
  });

  const onSubmit = (values: z.infer<typeof holidayFormSchema>) => {
    setIsLoading(true);
    addHoliday({
      name: values.name,
      date: format(values.date, 'yyyy-MM-dd'),
    });
    toast({ title: 'Holiday Added', description: `${values.name} has been added to the calendar.` });
    form.reset();
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
          <DialogTitle>Manage Holidays</DialogTitle>
          <DialogDescription>Add or remove holidays for the organization.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Holiday Name</FormLabel><FormControl><Input placeholder="e.g. Diwali" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading} className='w-full'>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Add Holiday'}
                </Button>
            </form>
            </Form>
            
            <div>
                <h4 className='text-sm font-medium mb-2'>Upcoming Holidays</h4>
                <ScrollArea className="h-40 rounded-md border">
                    <div className='p-2'>
                    {isInitialized && holidays.length > 0 ? (
                        holidays.map(holiday => (
                            <div key={holiday.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                               <div>
                                 <p className="font-medium">{holiday.name}</p>
                                 <p className="text-sm text-muted-foreground">{format(new Date(holiday.date), 'PPP')}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => removeHoliday(holiday.id)}>
                                    <Trash2 className="text-destructive h-4 w-4"/>
                               </Button>
                            </div>
                        ))
                    ) : (
                        <div className='flex items-center justify-center h-full text-sm text-muted-foreground p-4'>
                           No holidays added yet.
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
