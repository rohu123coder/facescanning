
'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Calendar as CalendarIcon, Sparkles, Upload, Link2, Trash2, File as FileIcon, Youtube } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { StaffSelectionModal } from './staff-selection-modal';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { suggestAssigneeForTask } from '@/ai/flows/auto-assign-task';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import type { Attachment } from '@/lib/data';


interface AddTaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const taskFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  assignedTo: z.array(z.string()),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['file', 'link']),
  })).optional(),
});

export function AddTaskModal({ isOpen, onOpenChange }: AddTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string, reasoning: string} | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addTask } = useTaskStore();
  const { staff } = useStaffStore();

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'Medium',
      assignedTo: [],
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attachments"
  });

  const assignedToIds = form.watch('assignedTo');
  const assignedStaff = staff.filter(s => assignedToIds.includes(s.id));

  const handleSelectStaff = (staffIds: string[]) => {
    form.setValue('assignedTo', staffIds);
    setIsStaffModalOpen(false);
  };
  
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


  const onSubmit = (values: z.infer<typeof taskFormSchema>) => {
    setIsLoading(true);
    try {
      addTask({
        ...values,
        dueDate: values.dueDate.toISOString(),
      });
      
      if (values.assignedTo && values.assignedTo.length > 0) {
        const assigneeNames = staff.filter(s => values.assignedTo.includes(s.id)).map(s => s.name);
        toast({
            title: 'Task Assigned!',
            description: `Task "${values.title}" has been assigned to ${assigneeNames.join(', ')}.`,
        });
        window.dispatchEvent(new CustomEvent('play-task-notification'));
      } else {
        toast({
          title: 'Task Created',
          description: `"${values.title}" has been added to the board.`,
        });
      }

      handleClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
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
  
  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    setAiSuggestion(null);
    setIsAddingLink(false);
    setLinkUrl('');
    onOpenChange(false);
  };
  
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create and assign a new task.
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
                    <Input placeholder="e.g., Develop new homepage design" {...field} />
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
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
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
                                form.setValue('assignedTo', [aiSuggestion.id]);
                                setAiSuggestion(null);
                            }}
                        >
                            Click to assign.
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <div className="space-y-2 rounded-md border p-2">
                 {fields.length > 0 ? (
                    fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-1 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 truncate">
                           {getAttachmentIcon(field as Attachment)}
                           <span className="text-sm truncate">{field.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
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

            <DialogFooter>
               <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                  Cancel
               </Button>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Task'}
              </Button>
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
