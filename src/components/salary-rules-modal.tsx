'use client';

import { useState, useEffect } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSalaryRulesStore, type SalaryRules } from '@/hooks/use-salary-rules-store';
import { Checkbox } from './ui/checkbox';

interface SalaryRulesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const daysOfWeek = [
    { id: '1', label: 'Monday' },
    { id: '2', label: 'Tuesday' },
    { id: '3', label: 'Wednesday' },
    { id: '4', label: 'Thursday' },
    { id: '5', label: 'Friday' },
    { id: '6', label: 'Saturday' },
    { id: '0', label: 'Sunday' },
];

const rulesFormSchema = z.object({
  workingDays: z.array(z.string()).refine((value) => value.some((day) => day), {
    message: 'You have to select at least one working day.',
  }),
});

export function SalaryRulesModal({ isOpen, onOpenChange }: SalaryRulesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { rules, setRules } = useSalaryRulesStore();

  const form = useForm<z.infer<typeof rulesFormSchema>>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: {
      workingDays: rules.workingDays,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({ workingDays: rules.workingDays });
    }
  }, [isOpen, rules, form]);

  const onSubmit = (values: z.infer<typeof rulesFormSchema>) => {
    setIsLoading(true);
    try {
      const newRules: SalaryRules = {
        ...rules,
        workingDays: values.workingDays,
      };
      setRules(newRules);
      
      toast({
        title: 'Rules Updated',
        description: 'Salary calculation rules have been saved successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update rules. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salary Calculation Rules</DialogTitle>
          <DialogDescription>
            Define the working days for your organization. This will affect salary calculation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="workingDays"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Working Days</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  {daysOfWeek.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="workingDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Rules'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
