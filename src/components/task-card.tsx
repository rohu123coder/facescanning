
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, User, Flag, MoreHorizontal } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/data';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onSelectTask: (task: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
  showActions?: boolean;
}

const priorityStyles: Record<Task['priority'], string> = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    High: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
    Urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
};

export function TaskCard({ task, onSelectTask, onUpdateTask, showActions = true }: TaskCardProps) {
  const { staff } = useStaffStore();
  const assignees = staff.filter(s => task.assignedTo.includes(s.id));
  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdateTask({ ...task, status: newStatus });
  };

  return (
    <Card className="hover:shadow-md transition-shadow" onClick={() => onSelectTask(task)}>
      <CardHeader className="flex-row justify-between items-start">
        <CardTitle className="text-base pr-2">{task.title}</CardTitle>
        {showActions && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">Change Status</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem disabled={task.status === 'To Do'} onClick={() => handleStatusChange('To Do')}>
                        To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={task.status === 'In Progress'} onClick={() => handleStatusChange('In Progress')}>
                        In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={task.status === 'Done'} onClick={() => handleStatusChange('Done')}>
                        Done
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
            <Badge variant="outline" className={priorityStyles[task.priority]}>
                <Flag className="mr-1" />
                {task.priority}
            </Badge>
            <Badge variant="secondary">{task.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <div className={cn('flex items-center gap-1', isOverdue && 'text-destructive font-semibold')}>
          <Calendar className="h-4 w-4" />
          <span>{format(dueDate, 'MMM d')}</span>
        </div>
        {assignees.length > 0 ? (
          <div className="flex -space-x-2">
            {assignees.slice(0, 2).map(assignee => (
                <TooltipProvider key={assignee.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-7 w-7 border-2 border-card">
                                <AvatarImage src={assignee.photoUrl} alt={assignee.name} />
                                <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{assignee.name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
            {assignees.length > 2 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Avatar className="h-7 w-7 border-2 border-card">
                                <AvatarFallback>+{assignees.length - 2}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{assignees.slice(2).map(a => a.name).join(', ')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
        ) : (
           <TooltipProvider>
             <Tooltip>
              <TooltipTrigger>
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
               <TooltipContent>
                <p>Unassigned</p>
              </TooltipContent>
             </Tooltip>
           </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
