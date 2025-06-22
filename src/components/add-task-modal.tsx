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
import { type Task } from '@/lib/data';
import { Loader2, Sparkles, CalendarIcon, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { autoAssignTask } from '@/ai/flows/auto-assign-task';
import { useStaffStore } from '@/hooks/use-staff-store';
import { Checkbox } from '@/components/ui/checkbox';


interface AddTaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTaskAdded: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

const taskFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  dueDate: z.date(),
  tags: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, 'At least one staff member must be assigned.'),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function AddTaskModal({ isOpen, onOpenChange, onTaskAdded }: AddTaskModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const { staffList } = useStaffStore();
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
        title: '',
        description: '',
        priority: 'Medium',
        assignedTo: [],
    },
  });
  
  const handleAutoAssign = async () => {
      setIsAiLoading(true);
      const taskDetails = form.getValues();
      
      if(!taskDetails.title) {
          toast({ variant: "destructive", title: "Title is required", description: "Please enter a task title before using auto-assign." });
          setIsAiLoading(false);
          return;
      }
      
      try {
        const result = await autoAssignTask({
            task: {
                title: taskDetails.title,
                description: taskDetails.description || '',
                priority: taskDetails.priority,
                requiredSkills: taskDetails.tags?.split(',').map(t => t.trim()) || [],
            },
            staffList: staffList,
        });
        
        form.setValue('assignedTo', result.assignedStaffIds, { shouldValidate: true });
        toast({ title: "AI Assignment Successful", description: result.reasoning });

      } catch (error) {
         toast({ variant: "destructive", title: "AI Assignment Failed", description: "Could not automatically assign the task. Please assign manually." });
         console.error("Auto-assignment error:", error);
      } finally {
          setIsAiLoading(false);
      }
  }

  const onSubmit = async (values: TaskFormValues) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onTaskAdded({
          ...values,
          description: values.description || '',
          tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
          dueDate: values.dueDate.toISOString(),
      });
      handleClose();
    } catch (error) {
      console.error("Failed to add task:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    form.reset();
    setPopoverOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task for your team.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Develop new user profile page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide a brief description of the task..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full text-left font-normal", !field.value && "text-muted-foreground")}
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
            </div>
            
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>Assign To</FormLabel>
                        <Button type="button" size="sm" variant="ghost" onClick={handleAutoAssign} disabled={isAiLoading}>
                           {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4 text-yellow-400"/>}
                            Auto-assign
                        </Button>
                    </div>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                className={cn("w-full justify-between h-auto min-h-10", !(field.value && field.value.length > 0) && "text-muted-foreground")}
                                >
                                <div className="flex gap-1 flex-wrap">
                                     {(field.value && field.value.length > 0) ? (
                                        staffList
                                            .filter(staff => field.value.includes(staff.id))
                                            .map(staff => <Badge key={staff.id} variant="secondary">{staff.name}</Badge>)
                                     ) : "Select staff..."}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                           <Command>
                            <CommandInput placeholder="Search staff..." />
                            <CommandList>
                            <CommandEmpty>No staff found.</CommandEmpty>
                            <CommandGroup>
                            {staffList.map((staff) => {
                                const isSelected = field.value?.includes(staff.id);
                                return (
                                <CommandItem
                                    key={staff.id}
                                    value={staff.name}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onSelect={() => {
                                      const currentSelection = field.value || [];
                                      const newSelection = isSelected
                                          ? currentSelection.filter(id => id !== staff.id)
                                          : [...currentSelection, staff.id];
                                      field.onChange(newSelection);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        className="mr-2"
                                    />
                                    {staff.name}
                                </CommandItem>
                                );
                            })}
                            </CommandGroup>
                           </CommandList>
                           </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags / Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Frontend, API, Bug" {...field} />
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
                {isSaving ? (<><Loader2 className="mr-2 animate-spin" /> Saving...</>) : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
