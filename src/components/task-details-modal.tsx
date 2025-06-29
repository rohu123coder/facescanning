
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useToast } from '@/hooks/use-toast';
import type { Task, Attachment } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, Trash2, Loader2, Sparkles, Upload, Link2, File as FileIcon, Youtube, MessageSquare } from 'lucide-react';
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
import { Badge } from './ui/badge';
import { TaskComments } from './task-comments';
import { useClientStore } from '@/hooks/use-client-store.tsx';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

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
  assignedTo: z.array(z.string()),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['file', 'link']),
  })).optional(),
});

export function TaskDetailsModal({ isOpen, onOpenChange, task }: TaskDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string, reasoning: string} | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateTask, deleteTask } = useTaskStore();
  const { staff } = useStaffStore();
  const { currentClient } = useClientStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskDetailSchema>>({
    resolver: zodResolver(taskDetailSchema),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attachments"
  });
  
  const assignedToIds = form.watch('assignedTo');
  const assignedStaff = staff.filter(s => assignedToIds && assignedToIds.includes(s.id));

  useEffect(() => {
    if (task) {
      form.reset({
        ...task,
        assignedTo: task.assignedTo || [],
        dueDate: new Date(task.dueDate),
        attachments: task.attachments || [],
      });
    }
     setAiSuggestion(null);
     setIsAddingLink(false);
     setLinkUrl('');
  }, [task, form, isOpen]);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        append({ name: file.name, url: dataUri, type: 'file' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLink = () => {
    if (linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'))) {
      const isYoutube = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be');
      append({ name: isYoutube ? 'YouTube Video' : 'Web Link', url: linkUrl, type: 'link' });
      setLinkUrl('');
      setIsAddingLink(false);
    } else {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid URL starting with http:// or https://' });
    }
  };

  const handleSelectStaff = (staffIds: string[]) => {
    form.setValue('assignedTo', staffIds);
    setIsStaffModalOpen(false);
  };

  const onSubmit = (values: z.infer<typeof taskDetailSchema>) => {
    if (!task) return;
    setIsLoading(true);
    try {
      const updatedTaskData = {
        ...task,
        ...values,
        dueDate: values.dueDate.toISOString(),
      };
      updateTask(updatedTaskData);
      
      const oldAssignees = new Set(task.assignedTo);
      const newAssignees = values.assignedTo.filter(id => !oldAssignees.has(id));

      if (newAssignees.length > 0) {
        const assigneeNames = staff.filter(s => newAssignees.includes(s.id)).map(s => s.name);
        toast({
            title: 'Task Assigned!',
            description: `Task "${values.title}" has been assigned to ${assigneeNames.join(', ')}.`,
        });
        window.dispatchEvent(new CustomEvent('play-task-notification'));
      } else {
         toast({
          title: 'Task Updated',
          description: `"${values.title}" has been updated.`,
        });
      }
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

  if (!task || !currentClient) return null;

  const getAttachmentIcon = (attachment: Attachment) => {
    if (attachment.type === 'link') {
        if (attachment.url.includes('youtube.com') || attachment.url.includes('youtu.be')) {
            return <Youtube className="text-red-500" />;
        }
        return <Link2 />;
    }
    return <FileIcon />;
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <DialogHeader>
              <DialogTitle className="sr-only">Edit Task Details</DialogTitle>
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
            <div className='flex-1 grid md:grid-cols-3 gap-6 min-h-0'>
                <ScrollArea className="md:col-span-2 pr-4 -mr-4">
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
                            <Textarea placeholder="Provide a detailed description of the task requirements..." {...field} rows={5}/>
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
                            <Button type="button" variant="outline" className="w-full justify-start h-auto min-h-10" onClick={() => setIsStaffModalOpen(true)}>
                                <User className="mr-2 h-4 w-4 shrink-0" />
                                <div className="flex flex-wrap items-center gap-1">
                                    {assignedStaff.length > 0 ? (
                                        assignedStaff.map(s => <Badge key={s.id} variant="secondary">{s.name}</Badge>)
                                    ) : (
                                        <span className="text-muted-foreground">Select staff member(s)</span>
                                    )}
                                </div>
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
                                      const currentAssigned = form.getValues('assignedTo');
                                      form.setValue('assignedTo', [...currentAssigned, aiSuggestion.id]);
                                      setAiSuggestion(null);
                                  }}
                              >
                                  Click to add assign.
                              </Button>
                          </AlertDescription>
                      </Alert>
                  )}

                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <div className="space-y-2 rounded-md border p-2">
                      {fields.length > 0 ? (
                          fields.map((field, index) => (
                          <a key={field.id} href={field.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-1 rounded-md bg-muted/50 hover:bg-muted">
                              <div className="flex items-center gap-2 truncate">
                                {getAttachmentIcon(field as Attachment)}
                                <span className="text-sm truncate">{field.name}</span>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.preventDefault(); remove(index); }}>
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                              </Button>
                          </a>
                      ))) : (
                          <p className="text-xs text-muted-foreground text-center p-2">No attachments added.</p>
                      )}
                    </div>
                    
                    {isAddingLink ? (
                      <div className="flex gap-2 items-center">
                          <Link2 className="text-muted-foreground"/>
                          <Input 
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="h-8"
                          />
                          <Button type="button" size="sm" onClick={handleAddLink}>Add</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingLink(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2"/> Upload File
                        </Button>
                        <Input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              onChange={handleFileSelect}
                              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,video/*"
                          />
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingLink(true)}>
                            <Link2 className="mr-2"/> Add Link
                        </Button>
                    </div>
                    )}
                  </FormItem>
                  </div>
                </ScrollArea>
                <div className="md:col-span-1 flex flex-col min-h-0 border-l pl-4 -ml-4">
                   <h3 className="text-lg font-semibold font-headline mb-2 flex items-center gap-2"><MessageSquare /> Comments</h3>
                   <Separator className="mb-4" />
                    <TaskComments
                      taskId={task.id}
                      comments={task.comments || []}
                      currentUser={{
                        id: 'client-admin',
                        name: currentClient.contactName,
                      }}
                    />
                </div>
            </div>
            <DialogFooter className="flex justify-between items-center mt-auto pt-4 border-t">
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
        initialSelectedIds={assignedToIds}
    />
    </>
  );
}
