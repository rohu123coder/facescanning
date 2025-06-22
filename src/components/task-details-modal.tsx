'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useTaskStore } from '@/hooks/use-task-store';
import { useStaffStore } from '@/hooks/use-staff-store';
import { type Task, type Staff, type Attachment } from '@/lib/data';

import { 
    Paperclip, MessageSquare, ArrowRight, User, Clock, Flag, Tag, Users, FileIcon, ImageIcon, VideoIcon, Trash2 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task;
  currentUser: Staff;
}

const commentFormSchema = z.object({
  text: z.string().optional(),
  attachment: z.any().optional(),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const FileTypeIcon = ({ type }: { type: string }) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-4 w-4 text-green-500" />;
    if (type === 'application/pdf') return <FileIcon className="h-4 w-4 text-red-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
};


export function TaskDetailsModal({ isOpen, onOpenChange, task, currentUser }: TaskDetailsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{name: string, url: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { staffList } = useStaffStore();
  const { addTaskActivity, updateTaskStatus, deleteTask } = useTaskStore();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
  });
  
  const assignedStaff = staffList.filter(s => task.assignedTo.includes(s.id));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview({
            name: file.name,
            url: e.target?.result as string,
            type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: CommentFormValues) => {
    if (!values.text && !attachmentPreview) return;
    setIsSubmitting(true);
    
    try {
        if (values.text) {
            addTaskActivity(task.id, {
                authorId: currentUser.id,
                authorName: currentUser.name,
                type: 'comment',
                text: values.text,
            });
        }
        if (attachmentPreview) {
             addTaskActivity(task.id, {
                authorId: currentUser.id,
                authorName: currentUser.name,
                type: 'attachment',
                text: `Attached a file: ${attachmentPreview.name}`,
                attachment: { ...attachmentPreview }
            });
        }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      form.reset({ text: '' });
      setAttachmentPreview(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post update.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusChange = (newStatus: Task['status']) => {
      updateTaskStatus(task.id, newStatus, currentUser);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Left Column: Details */}
            <div className="col-span-1 p-4 border-r overflow-y-auto">
                <h3 className="font-semibold mb-4 text-lg">Details</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex items-start">
                        <User className="h-4 w-4 mt-0.5 mr-3 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Assigned To</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {assignedStaff.map(s => (
                                    <div key={s.id} className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={s.photoUrl} alt={s.name} />
                                            <AvatarFallback>{getInitials(s.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-muted-foreground">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                        <p className="font-semibold">Due Date:</p>
                        <p className="ml-2 text-muted-foreground">{format(new Date(task.dueDate), 'PPP')}</p>
                    </div>
                    <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-3 text-muted-foreground" />
                        <p className="font-semibold">Priority:</p>
                        <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'} className="ml-2">{task.priority}</Badge>
                    </div>
                    <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-3 text-muted-foreground" />
                        <p className="font-semibold">Tags:</p>
                         <div className="flex flex-wrap gap-1 ml-2">
                            {task.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                    </div>
                    <Separator />
                    <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
            </div>

            {/* Right Column: Activity */}
            <div className="col-span-2 p-4 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Activity</h3>
                    <Select onValueChange={handleStatusChange} value={task.status}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <ScrollArea className="flex-1 -mx-4">
                    <div className="px-4 space-y-6">
                        {task.activity.map(act => (
                            <div key={act.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={staffList.find(s=>s.id === act.authorId)?.photoUrl} />
                                    <AvatarFallback>{getInitials(act.authorName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{act.authorName}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <div className="text-sm bg-muted rounded-md p-3 mt-1">
                                        {act.type === 'comment' && <p>{act.text}</p>}
                                        {act.type === 'creation' && <p className="text-muted-foreground italic">Created this task.</p>}
                                        {act.type === 'status_change' && (
                                            <p className="text-muted-foreground italic">
                                                Changed status from <Badge variant="secondary">{act.oldStatus}</Badge> to <Badge variant="secondary">{act.newStatus}</Badge>
                                            </p>
                                        )}
                                        {act.type === 'attachment' && act.attachment && (
                                            <div>
                                                 <p className="text-muted-foreground italic mb-2">{act.text}</p>
                                                 <a href={act.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-background rounded-md border hover:bg-accent">
                                                     <FileTypeIcon type={act.attachment.type} />
                                                     <span className="font-medium text-blue-600 truncate">{act.attachment.name}</span>
                                                 </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <Separator className="my-4" />

                {/* Comment Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                        {attachmentPreview && (
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                <FileTypeIcon type={attachmentPreview.type} />
                                <span className="text-sm truncate flex-1">{attachmentPreview.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAttachmentPreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <div className="relative">
                                    <Textarea placeholder="Add a comment..." {...field} className="pr-24" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                         <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip className="h-5 w-5" />
                                         </Button>
                                         <Button type="submit" size="icon" disabled={isSubmitting}>
                                            <ArrowRight className="h-5 w-5" />
                                         </Button>
                                    </div>
                                    </div>
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </form>
                </Form>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
