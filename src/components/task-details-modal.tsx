'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '@/hooks/use-task-store';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskStatus } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, Trash2, Loader2, Sparkles } from 'lucide-react';
import { StaffSelectionModal } from './staff-selection-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { suggestAssigneeForTask } from '@/ai/flows/auto-assign-task';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


interface TaskDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
}

const taskDetailSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  assignedTo: z.string().nullable(),
});

export function TaskDetailsModal({ isOpen, onOpenChange, task }: TaskDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string, reasoning: string} | null>(null);

  const { updateTask, deleteTask } = useTaskStore();
  const { staff } = useStaffStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskDetailSchema>>({
    resolver: zodResolver(taskDetailSchema),
  });
  
  const assignedToId = form.watch('assignedTo');
  const assignedStaff = staff.find(s => s.id === assignedToId);

  useEffect(() => {
    if (task) {
      form.reset({
        ...task,
        dueDate: new Date(task.dueDate),
      });
    }
  }, [task, form]);

  const handleSelectStaff = (staffId: string) => {
    form.setValue('assignedTo', staffId);
    setIsStaffModalOpen(false);
  };

  const onSubmit = (values: z.infer<typeof taskDetailSchema>) => {
    if (!task) return;
    setIsLoading(true);
    try {
      updateTask({
        ...task,
        ...values,
        dueDate: values.dueDate.toISOString(),
      });
      toast({
        title: 'Task Updated',
        description: `"${values.title}" has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    toast({
      title: 'Task Deleted',
      description: `"${task.title}" has been removed.`,
    });
    onOpenChange(false);
  };
  
  const handleAiSuggestion = async () => {
      const taskDescription = form.getValues('description');
      if (!taskDescription || taskDescription.length < 10) {
          toast({ variant: 'destructive', title: 'Description too short', description: 'Please provide a more detailed description for an AI suggestion.' });
          return;
      }

      setIsAiLoading(true);
      setAiSuggestion(null);
      try {
          const staffListForAI = staff.map(s => ({ id: s.id, name: s.name, role: s.role, department: s.department }));
          const result = await suggestAssigneeForTask({ taskDescription, staffList: staffListForAI });

          if (result.suggestedStaffId) {
              const suggested = staff.find(s => s.id === result.suggestedStaffId);
              if (suggested) {
                  setAiSuggestion({ id: suggested.id, reasoning: result.reasoning });
              }
          } else {
              toast({ title: 'AI Suggestion', description: result.reasoning });
          }
      } catch (error) {
          console.error("AI Suggestion error", error);
          toast({ variant: 'destructive', title: 'AI Error', description: 'Could not get AI suggestion.' });
      } finally {
          setIsAiLoading(false);
      }
  };

  if (!task) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input className="text-lg font-headline border-none shadow-none -ml-3 p-0 focus-visible:ring-0" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </DialogHeader>
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Provide a detailed description of the task requirements..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Design, Development" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
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
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setIsStaffModalOpen(true)}>
                        <User className="mr-2"/>
                        {assignedStaff ? `Assigned to ${assignedStaff.name}` : 'Select a staff member'}
                    </Button>
                     <Button type="button" variant="outline" size="icon" onClick={handleAiSuggestion} disabled={isAiLoading}>
                        {isAiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        <span className="sr-only">Get AI Suggestion</span>
                    </Button>
                </div>
              </FormItem>

             {aiSuggestion && (
                 <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>AI Suggestion</AlertTitle>
                    <AlertDescription>
                        {aiSuggestion.reasoning}
                        <Button 
                            variant="link" 
                            className="p-0 h-auto ml-1"
                            onClick={() => {
                                form.setValue('assignedTo', aiSuggestion.id);
                                setAiSuggestion(null);
                            }}
                        >
                            Click to assign.
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            </div>
            <DialogFooter className="flex justify-between items-center">
              <AlertDialog>
                 <AlertDialogTrigger asChild>
                     <Button type="button" variant="destructive" size="icon"><Trash2/></Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="space-x-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     <StaffSelectionModal 
        isOpen={isStaffModalOpen} 
        onOpenChange={setIsStaffModalOpen} 
        onSelectStaff={handleSelectStaff}
    />
    </>
  );
}
