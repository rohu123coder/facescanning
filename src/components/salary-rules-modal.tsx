
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { type SalaryRules } from '@/lib/data';

interface SalaryRulesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const daysOfWeek = [
    { id: '0', label: 'Sunday' },
    { id: '1', label: 'Monday' },
    { id: '2', label: 'Tuesday' },
    { id: '3', label: 'Wednesday' },
    { id: '4', label: 'Thursday' },
    { id: '5', label: 'Friday' },
    { id: '6', label: 'Saturday' },
];

const rulesFormSchema = z.object({
  offDays: z.array(z.string()),
  basic: z.number().min(0).max(100),
  hra: z.number().min(0).max(100),
  standardDeduction: z.number().min(0).max(100),
}).refine(data => data.basic + data.hra <= 100, {
    message: "Basic and HRA combined cannot exceed 100%",
    path: ["hra"],
});

export function SalaryRulesModal({ isOpen, onOpenChange }: SalaryRulesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { rules, setRules } = useSalaryRulesStore();
  
  const form = useForm<z.infer<typeof rulesFormSchema>>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: rules,
  });

  useEffect(() => {
    form.reset(rules);
  }, [rules, isOpen, form]);

  const basicValue = form.watch('basic');
  const hraValue = form.watch('hra');
  const specialAllowance = 100 - basicValue - hraValue;


  const onSubmit = (values: z.infer<typeof rulesFormSchema>) => {
    setIsLoading(true);
    setRules(values as SalaryRules);
    toast({ title: "Rules Saved", description: "Salary rules have been updated successfully." });
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Salary Calculation Rules</DialogTitle>
          <DialogDescription>
            Set the rules for salary calculation. These will apply to all staff.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="offDays"
              render={() => (
                <FormItem>
                  <FormLabel>Weekly Off Days</FormLabel>
                  <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                    {daysOfWeek.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="offDays"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller control={form.control} name="basic" render={({ field }) => (
                <FormItem>
                    <FormLabel>Basic Salary (% of Gross)</FormLabel>
                     <div className="flex items-center gap-4">
                         <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={100} step={1} />
                         <span className="font-mono text-lg w-16 text-center">{field.value}%</span>
                     </div>
                </FormItem>
            )} />

             <Controller control={form.control} name="hra" render={({ field }) => (
                <FormItem>
                    <FormLabel>HRA (% of Gross)</FormLabel>
                     <div className="flex items-center gap-4">
                         <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={100 - basicValue} step={1} />
                         <span className="font-mono text-lg w-16 text-center">{field.value}%</span>
                     </div>
                     <FormMessage />
                </FormItem>
            )} />

            <FormItem>
                <FormLabel>Special Allowance (% of Gross)</FormLabel>
                 <div className="flex items-center gap-4">
                     <Slider value={[specialAllowance]} disabled max={100} step={1} />
                     <span className="font-mono text-lg w-16 text-center text-muted-foreground">{specialAllowance}%</span>
                 </div>
                 <p className="text-xs text-muted-foreground">This is calculated automatically (100% - Basic - HRA).</p>
            </FormItem>
            
             <Controller control={form.control} name="standardDeduction" render={({ field }) => (
                <FormItem>
                    <FormLabel>Standard Deduction (% of Gross)</FormLabel>
                     <div className="flex items-center gap-4">
                         <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} max={100} step={1} />
                         <span className="font-mono text-lg w-16 text-center">{field.value}%</span>
                     </div>
                </FormItem>
            )} />


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Save Rules'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
