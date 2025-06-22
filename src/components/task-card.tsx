'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Task, type Staff } from "@/lib/data";
import { format } from 'date-fns';
import { AlarmClock, MessageSquare } from "lucide-react";

interface TaskCardProps {
    task: Task;
    staffList: Staff[];
    onClick: () => void;
}

const priorityClasses = {
    High: 'border-red-500/80',
    Medium: 'border-yellow-500/80',
    Low: 'border-gray-500/50',
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function TaskCard({ task, staffList, onClick }: TaskCardProps) {

    const assignedStaff = staffList.filter(staff => task.assignedTo.includes(staff.id));
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && task.status !== 'Completed';

    return (
        <Card 
            onClick={onClick}
            className={`mb-4 hover:shadow-md transition-shadow border-l-4 ${priorityClasses[task.priority]} cursor-pointer`}>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold leading-tight">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{task.activity?.filter(a => a.type === 'comment').length || 0} comments</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                       <AlarmClock className="h-3 w-3" />
                       <span>{format(dueDate, 'dd MMM')}</span>
                    </div>
                </div>
                
                 <div className="flex items-center justify-between">
                    <TooltipProvider>
                        <div className="flex -space-x-2">
                            {assignedStaff.slice(0, 3).map(staff => (
                                <Tooltip key={staff.id}>
                                <TooltipTrigger asChild>
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
                             {assignedStaff.length > 3 && (
                                <Avatar className="h-6 w-6 border-2 border-background bg-muted text-muted-foreground">
                                    <AvatarFallback>+{assignedStaff.length - 3}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </TooltipProvider>

                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
