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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSalaryRulesStore, type SalaryRules } from '@/hooks/use-salary-rules-store';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

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
  basicSalaryPercentage: z.number().min(0, "Cannot be less than 0").max(100, "Cannot be more than 100"),
  hraPercentage: z.number().min(0, "Cannot be less than 0").max(100, "Cannot be more than 100"),
  standardDeductionPercentage: z.number().min(0, "Cannot be less than 0").max(100, "Cannot be more than 100"),
}).refine(data => data.basicSalaryPercentage + data.hraPercentage <= 100, {
  message: 'Basic Salary and HRA percentage combined cannot exceed 100%.',
  path: ['hraPercentage'],
});


export function SalaryRulesModal({ isOpen, onOpenChange }: SalaryRulesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { rules, setRules } = useSalaryRulesStore();

  const form = useForm<z.infer<typeof rulesFormSchema>>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: {
      workingDays: rules.workingDays,
      basicSalaryPercentage: rules.basicSalaryPercentage,
      hraPercentage: rules.hraPercentage,
      standardDeductionPercentage: rules.standardDeductionPercentage
    },
  });
  
  const basicPercentage = form.watch('basicSalaryPercentage');
  const hraPercentage = form.watch('hraPercentage');
  const [specialAllowance, setSpecialAllowance] = useState(0);

  useEffect(() => {
    if (isOpen) {
        form.reset({
            workingDays: rules.workingDays,
            basicSalaryPercentage: rules.basicSalaryPercentage,
            hraPercentage: rules.hraPercentage,
            standardDeductionPercentage: rules.standardDeductionPercentage
        });
    }
  }, [isOpen, rules, form]);
  
  useEffect(() => {
    const basic = basicPercentage || 0;
    const hra = hraPercentage || 0;
    const special = 100 - basic - hra;
    setSpecialAllowance(special < 0 ? 0 : special);
  }, [basicPercentage, hraPercentage]);

  const onSubmit = (values: z.infer<typeof rulesFormSchema>) => {
    setIsLoading(true);
    try {
      setRules(values);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Salary Rules Setup</DialogTitle>
          <DialogDescription>
            Define the rules for salary calculation. These rules apply to all employees.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
            <FormField
              control={form.control}
              name="workingDays"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base font-semibold">Weekly Off-Days</FormLabel>
                    <FormDescription>Select the days that are non-working days each week.</FormDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
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
                                checked={!field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  const isWorking = !checked;
                                  return isWorking
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
            
            <FormField
              control={form.control}
              name="basicSalaryPercentage"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex justify-between font-semibold">
                        <span>Basic Salary Percentage</span>
                        <span className="text-primary font-bold">{field.value}%</span>
                    </FormLabel>
                    <FormControl>
                        <Slider 
                            defaultValue={[field.value]} 
                            onValueChange={(value) => field.onChange(value[0])}
                            max={100} 
                            step={1}
                        />
                    </FormControl>
                    <FormDescription>The percentage of the employee's earned gross salary that constitutes the basic pay.</FormDescription>
                    <FormMessage/>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hraPercentage"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex justify-between font-semibold">
                        <span>House Rent Allowance (HRA) %</span>
                        <span className="text-primary font-bold">{field.value}%</span>
                    </FormLabel>
                    <FormControl>
                        <Slider 
                            defaultValue={[field.value]} 
                            onValueChange={(value) => field.onChange(value[0])}
                            max={100} 
                            step={1}
                        />
                    </FormControl>
                    <FormDescription>The percentage of the employee's earned gross salary provided as house rent allowance.</FormDescription>
                     <FormMessage/>
                </FormItem>
              )}
            />

             <FormItem>
                <FormLabel className="flex justify-between font-semibold">
                    <span>Special Allowance Percentage</span>
                     <span className="text-primary font-bold">{specialAllowance}%</span>
                </FormLabel>
                <FormControl>
                    <Input readOnly disabled value={`${specialAllowance}%`} />
                </FormControl>
                <FormDescription>This is calculated automatically (100% - Basic% - HRA%) to balance the earnings.</FormDescription>
            </FormItem>


            <FormField
              control={form.control}
              name="standardDeductionPercentage"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex justify-between font-semibold">
                        <span>Standard Deduction %</span>
                        <span className="text-primary font-bold">{field.value}%</span>
                    </FormLabel>
                    <FormControl>
                        <Slider 
                            defaultValue={[field.value]} 
                            onValueChange={(value) => field.onChange(value[0])}
                            max={100} 
                            step={1}
                        />
                    </FormControl>
                    <FormDescription>The percentage of standard deductions (like PF) from the employee's earned gross salary.</FormDescription>
                    <FormMessage/>
                </FormItem>
              )}
            />
            </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4 mt-2">
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
