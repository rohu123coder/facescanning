'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Task, type Staff } from "@/lib/data";
import { format, formatDistanceToNow } from 'date-fns';
import { AlarmClock, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

interface TaskCardProps {
    task: Task;
    staffList: Staff[];
    onStatusChange: (taskId: string, status: Task['status']) => void;
    onDelete: (taskId: string) => void;
}

const priorityClasses = {
    High: 'border-red-500/80',
    Medium: 'border-yellow-500/80',
    Low: 'border-gray-500/50',
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function TaskCard({ task, staffList, onStatusChange, onDelete }: TaskCardProps) {

    const assignedStaff = staffList.filter(staff => task.assignedTo.includes(staff.id));
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && task.status !== 'Completed';

    return (
        <Card className={`mb-4 hover:shadow-md transition-shadow border-l-4 ${priorityClasses[task.priority]}`}>
            <CardHeader className="p-4 pb-2 flex-row items-start justify-between">
                <CardTitle className="text-base font-semibold leading-tight">{task.title}</CardTitle>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Move to</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'Pending')} disabled={task.status === 'Pending'}>Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'In Progress')} disabled={task.status === 'In Progress'}>In Progress</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'Completed')} disabled={task.status === 'Completed'}>Completed</DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Task
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                        <div className="flex -space-x-2">
                            {assignedStaff.slice(0, 3).map(staff => (
                                <Tooltip key={staff.id}>
                                <TooltipTrigger>
                                <Avatar className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={staff.photoUrl} alt={staff.name} />
                                    <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                                </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{staff.name}</p>
                                </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                        </TooltipProvider>
                        {assignedStaff.length > 3 && (
                            <Badge variant="secondary">+{assignedStaff.length - 3}</Badge>
                        )}
                    </div>
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                       <AlarmClock className="h-3 w-3" />
                       <span>{format(dueDate, 'dd MMM')}</span>
                    </div>
                </div>
                 {task.tags && task.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
