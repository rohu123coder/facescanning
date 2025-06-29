
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useToast } from '@/hooks/use-toast';
import type { Task, Attachment } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Paperclip, Flag, MessageSquare, Link2, File as FileIcon, Youtube, User } from 'lucide-react';
import { TaskComments } from './task-comments';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface EmployeeTaskDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
}

const taskDetailSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Done']),
});

export function EmployeeTaskDetailsModal({ isOpen, onOpenChange, task }: EmployeeTaskDetailsModalProps) {
  const { updateTask } = useTaskStore();
  const { staff } = useStaffStore();
  const { currentEmployeeId } = useEmployeeAuthStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskDetailSchema>>({
    resolver: zodResolver(taskDetailSchema),
  });

  const currentEmployee = staff.find(s => s.id === currentEmployeeId);

  useEffect(() => {
    if (task) {
      form.reset({
        status: task.status,
      });
    }
  }, [task, form, isOpen]);

  const handleStatusChange = (newStatus: 'To Do' | 'In Progress' | 'Done') => {
    if (!task) return;
    updateTask({ ...task, status: newStatus });
    toast({ title: 'Status Updated', description: `Task status changed to "${newStatus}".` });
  };
  
  if (!task || !currentEmployee) return null;

  const getAttachmentIcon = (attachment: Attachment) => {
    if (attachment.type === 'link') {
        if (attachment.url.includes('youtube.com') || attachment.url.includes('youtu.be')) {
            return <Youtube className="text-red-500" />;
        }
        return <Link2 />;
    }
    return <FileIcon />;
  };
  
  const assignees = staff.filter(s => task.assignedTo.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 grid md:grid-cols-3 gap-6 min-h-0">
          <ScrollArea className="md:col-span-2 pr-4 -mr-4">
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2">Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                           <Flag className="h-4 w-4 text-muted-foreground" />
                           <span className="font-medium">Priority:</span>
                           <Badge variant="outline">{task.priority}</Badge>
                        </div>
                         <div className="flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                           <span className="font-medium">Due Date:</span>
                           <span>{format(parseISO(task.dueDate), 'PP')}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{task.description}</p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Assigned Team</h4>
                     {assignees.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {assignees.map(assignee => (
                                <div key={assignee.id} className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={assignee.photoUrl} />
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{assignee.name}</p>
                                        <p className="text-xs text-muted-foreground">{assignee.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                         <p className="text-sm text-muted-foreground">Not assigned to anyone.</p>
                     )}
                </div>

                {task.attachments && task.attachments.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Attachments</h4>
                        <div className="space-y-2">
                            {task.attachments.map((att, index) => (
                                <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                                    {getAttachmentIcon(att)}
                                    <span className="text-sm font-medium text-primary underline-offset-4 hover:underline">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

            </div>
          </ScrollArea>
          <div className="md:col-span-1 flex flex-col min-h-0 border-l pl-4 -ml-4">
            <Form {...form}>
              <form>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Update Status</FormLabel>
                      <Select onValueChange={(value) => handleStatusChange(value as TaskStatus)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Change status..." />
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
              </form>
            </Form>
            <h3 className="text-lg font-semibold font-headline mb-2 flex items-center gap-2"><MessageSquare /> Comments</h3>
            <Separator className="mb-4" />
            <TaskComments
              taskId={task.id}
              comments={task.comments || []}
              currentUser={{
                id: currentEmployee.id,
                name: currentEmployee.name,
                imageUrl: currentEmployee.photoUrl,
              }}
            />
          </div>
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
