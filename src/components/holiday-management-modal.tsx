'use client';

import { useState, useMemo } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useHolidayStore } from '@/hooks/use-holiday-store';
import { type Holiday } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface HolidayManagementModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const holidayFormSchema = z.object({
  name: z.string().min(2, { message: 'Holiday name must be at least 2 characters.' }),
  date: z.date({ required_error: 'A date is required.' }),
});

export function HolidayManagementModal({ isOpen, onOpenChange }: HolidayManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { holidays, addHoliday, deleteHoliday, isInitialized } = useHolidayStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const form = useForm<z.infer<typeof holidayFormSchema>>({
    resolver: zodResolver(holidayFormSchema),
  });

  const onSubmit = (values: z.infer<typeof holidayFormSchema>) => {
    const holiday: Holiday = {
      name: values.name,
      date: format(values.date, 'yyyy-MM-dd'),
    };

    if (holidays.some(h => h.date === holiday.date)) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Date',
            description: 'A holiday for this date already exists.',
        });
        return;
    }

    addHoliday(holiday);
    toast({
      title: 'Holiday Added',
      description: `${values.name} on ${format(values.date, 'PPP')} has been added.`,
    });
    form.reset();
  };
  
  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  }

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => new Date(h.date).getFullYear() === currentYear);
  }, [holidays, currentYear]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Holiday Calendar</DialogTitle>
          <DialogDescription>
            Add or remove company-wide holidays for the year.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4 items-end">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>Holiday Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Diwali" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="col-span-3 sm:col-span-1">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading} className="col-span-3 sm:col-span-1">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Add Holiday'}
                </Button>
            </form>
            </Form>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Holidays for {currentYear}</h3>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleYearChange(currentYear - 1)}>‹ Prev</Button>
                        <Button variant="outline" size="sm" onClick={() => handleYearChange(currentYear + 1)}>Next ›</Button>
                    </div>
                </div>
                <ScrollArea className="h-48 rounded-md border p-2">
                    {isInitialized && filteredHolidays.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredHolidays.map(holiday => (
                                <li key={holiday.date} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-accent">
                                    <span>
                                        <span className="font-semibold">{holiday.name}</span> - {format(new Date(holiday.date), 'EEE, dd MMM')}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteHoliday(holiday.date)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            {isInitialized ? 'No holidays added for this year.' : 'Loading holidays...'}
                        </div>
                    )}
                </ScrollArea>
             </div>
        </div>
        <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
