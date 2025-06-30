
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useToast } from '@/hooks/use-toast';
import type { Task, Attachment } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { format } from 'date-fns';
import { CalendarIcon, User, Trash2, Loader2, Upload, Link2, File as FileIcon, Youtube, MessageSquare, Flag, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { TaskComments } from './task-comments';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Input } from './ui/input';

interface EmployeeTaskDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
}

const taskStatusSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Done']),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['file', 'link']),
  })).optional(),
});

export function EmployeeTaskDetailsModal({ isOpen, onOpenChange, task }: EmployeeTaskDetailsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateTask } = useTaskStore();
  const { employee } = useEmployeeAuthStore();
  const { staff } = useStaffStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskStatusSchema>>({
    resolver: zodResolver(taskStatusSchema),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attachments"
  });

  useEffect(() => {
    if (task) {
      form.reset({
        status: task.status,
        attachments: task.attachments || [],
      });
    }
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

  const onSubmit = (values: z.infer<typeof taskStatusSchema>) => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const updatedTaskData: Task = {
        ...task,
        status: values.status,
        attachments: values.attachments,
      };
      updateTask(updatedTaskData);
      toast({ title: 'Task Updated', description: `Status changed to "${values.status}".` });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task || !employee) return null;
  
  const assignees = staff.filter(s => task.assignedTo.includes(s.id));

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <DialogHeader>
                <h1 className="text-2xl font-headline">{task.title}</h1>
                <div className="text-sm text-muted-foreground pt-1">
                    In category: <Badge variant="secondary">{task.category}</Badge>
                </div>
            </DialogHeader>
            <div className='flex-1 grid md:grid-cols-3 gap-6 min-h-0 py-4'>
                <ScrollArea className="md:col-span-2 pr-4 -mr-4">
                  <div className="space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                      <Separator />
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
                              <p className="text-xs text-muted-foreground text-center p-2">No attachments.</p>
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
                              />
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingLink(true)}>
                                <Link2 className="mr-2"/> Add Link
                            </Button>
                          </div>
                        )}
                      </FormItem>
                  </div>
                </ScrollArea>
                <div className="md:col-span-1 flex flex-col min-h-0 space-y-4">
                    <div className="space-y-2 p-3 rounded-lg border">
                        <h3 className="font-semibold text-sm flex items-center gap-2"><CheckCircle/> Status</h3>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
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
                            </FormItem>
                          )}
                        />
                    </div>
                     <div className="space-y-2 p-3 rounded-lg border">
                        <h3 className="font-semibold text-sm flex items-center gap-2"><User/> Assigned Team</h3>
                        <div className="flex flex-wrap gap-2">
                            {assignees.map(a => (
                                <TooltipProvider key={a.id}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Avatar>
                                                <AvatarImage src={a.photoUrl} alt={a.name} />
                                                <AvatarFallback>{a.name.slice(0,2)}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{a.name}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-2 p-3 rounded-lg border">
                        <h3 className="font-semibold text-sm">Details</h3>
                        <div className='text-sm space-y-1'>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-1"><Flag/> Priority</span> <Badge variant="outline">{task.priority}</Badge></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-1"><CalendarIcon/> Due Date</span> <span>{format(new Date(task.dueDate), "PP")}</span></div>
                        </div>
                    </div>
                   <div className="flex-1 flex flex-col min-h-0 border rounded-lg p-3">
                     <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><MessageSquare /> Comments</h3>
                      <TaskComments
                        taskId={task.id}
                        comments={task.comments || []}
                        currentUser={{
                          id: employee.id,
                          name: employee.name,
                          imageUrl: employee.photoUrl,
                        }}
                      />
                   </div>
                </div>
            </div>
            <DialogFooter className="mt-auto pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
