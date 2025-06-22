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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SalaryRulesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const rulesFormSchema = z.object({
  basicPercentage: z.coerce.number().min(0).max(100, 'Cannot exceed 100%'),
  hraPercentage: z.coerce.number().min(0).max(100, 'Cannot exceed 100%'),
  deductionPercentage: z.coerce.number().min(0).max(100, 'Cannot exceed 100%'),
}).refine(data => data.basicPercentage + data.hraPercentage <= 100, {
  message: "Basic and HRA percentage together cannot exceed 100%.",
  path: ["hraPercentage"],
});


export function SalaryRulesModal({ isOpen, onOpenChange }: SalaryRulesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { rules, updateRules, isInitialized } = useSalaryRulesStore();

  const form = useForm<z.infer<typeof rulesFormSchema>>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: rules,
  });
  
  useEffect(() => {
      if(isInitialized) {
          form.reset(rules);
      }
  }, [isInitialized, rules, form, isOpen]);
  
  const basicPercentage = form.watch('basicPercentage');
  const hraPercentage = form.watch('hraPercentage');
  const specialAllowancePercentage = 100 - (basicPercentage || 0) - (hraPercentage || 0);


  const onSubmit = async (values: z.infer<typeof rulesFormSchema>) => {
    setIsLoading(true);
    try {
      updateRules(values);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Salary Rules Updated',
        description: 'The new salary calculation rules have been saved.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update salary rules. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Salary Rules Setup</DialogTitle>
          <DialogDescription>
            Define the percentage-based rules for salary calculation. These rules apply to all employees.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="basicPercentage"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Basic Salary Percentage</FormLabel>
                    <span className="text-sm font-medium">{field.value}%</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    The percentage of the employee's earned gross salary that constitutes the basic pay.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hraPercentage"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>House Rent Allowance (HRA) %</FormLabel>
                    <span className="text-sm font-medium">{field.value}%</span>
                  </div>
                  <FormControl>
                     <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    The percentage of the employee's earned gross salary provided as house rent allowance.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                <FormLabel>Special Allowance Percentage</FormLabel>
                <FormControl>
                    <Input
                    readOnly
                    disabled
                    value={`${specialAllowancePercentage.toFixed(0)}%`}
                    className="text-muted-foreground font-medium"
                    />
                </FormControl>
                <FormDescription>
                    This is calculated automatically (100% - Basic% - HRA%) to balance the earnings.
                </FormDescription>
            </FormItem>
             <FormField
              control={form.control}
              name="deductionPercentage"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Standard Deduction %</FormLabel>
                    <span className="text-sm font-medium">{field.value}%</span>
                  </div>
                   <FormControl>
                     <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                   <FormDescription>
                    The percentage of standard deductions (like PF) from the employee's earned gross salary.
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
               <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={isLoading}>
                  Cancel
               </Button>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Rules'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
