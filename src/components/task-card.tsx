'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, User, Flag } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useStaffStore } from '@/hooks/use-staff-store';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/data';

interface TaskCardProps {
  task: Task;
  onSelectTask: (task: Task) => void;
}

const priorityStyles: Record<Task['priority'], string> = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    High: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
    Urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
};

export function TaskCard({ task, onSelectTask }: TaskCardProps) {
  const { staff } = useStaffStore();
  const assignedStaff = staff.find(s => s.id === task.assignedTo);
  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectTask(task)}>
      <CardHeader>
        <CardTitle className="text-base">{task.title}</CardTitle>
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
        {assignedStaff ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={assignedStaff.photoUrl} alt={assignedStaff.name} />
                  <AvatarFallback>{assignedStaff.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>Assigned to {assignedStaff.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
