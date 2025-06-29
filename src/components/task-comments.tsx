
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { type Comment } from '@/lib/data';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  currentUser: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

const commentSchema = z.object({
  text: z.string().min(1, { message: "Comment cannot be empty." }),
});

export function TaskComments({ taskId, comments, currentUser }: TaskCommentsProps) {
  const { addCommentToTask } = useTaskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });

  const onSubmit = async (values: z.infer<typeof commentSchema>) => {
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 300)); // Simulate network latency
    
    addCommentToTask(taskId, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorImageUrl: currentUser.imageUrl,
      text: values.text,
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.authorImageUrl} />
                  <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md mt-1">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-muted-foreground py-4">No comments yet. Start the conversation!</p>
          )}
        </div>
      </ScrollArea>
      <div className="mt-4 pt-4 border-t">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea 
                      placeholder="Add a comment..." 
                      rows={2} 
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
