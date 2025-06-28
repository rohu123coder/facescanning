
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { type Task } from '@/lib/data';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const priorityStyles: Record<Task['priority'], string> = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    High: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
    Urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
};

const statusStyles: Record<Task['status'], string> = {
    'To Do': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Done': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

export function TaskListView({ tasks, onSelectTask }: TaskListViewProps) {
    const { staff } = useStaffStore();

    const getAssignees = (assigneeIds: string[]) => {
        return staff.filter(s => assigneeIds.includes(s.id));
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length > 0 ? (
                            tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => (
                                <TableRow key={task.id} onClick={() => onSelectTask(task)} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{task.title}</span>
                                            <span className="text-xs text-muted-foreground">{task.category}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex -space-x-2">
                                            {getAssignees(task.assignedTo).slice(0, 3).map(assignee => (
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
                                             {getAssignees(task.assignedTo).length > 3 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                        <Avatar className="h-7 w-7 border-2 border-card">
                                                            <AvatarFallback>+{getAssignees(task.assignedTo).length - 3}</AvatarFallback>
                                                        </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{getAssignees(task.assignedTo).slice(3).map(a => a.name).join(', ')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("border", priorityStyles[task.priority])}>
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(task.dueDate), 'PP')}</TableCell>
                                    <TableCell>
                                         <Badge variant="outline" className={cn("border", statusStyles[task.status])}>
                                            {task.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No tasks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
