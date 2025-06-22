'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, List, Calendar as CalendarIcon, LayoutDashboard, BarChart2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskStore } from '@/hooks/use-task-store';
import { useStaffStore } from '@/hooks/use-staff-store';
import { AddTaskModal } from '@/components/add-task-modal';
import { TaskCard } from '@/components/task-card';
import { type Task } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSameDay, startOfToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"


const priorityBadgeVariant = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline"
} as const;

export default function TaskManagementPage() {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { tasks, updateTaskStatus, deleteTask, isInitialized: tasksInitialized } = useTaskStore();
  const { staffList, isInitialized: staffInitialized } = useStaffStore();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const isDataReady = tasksInitialized && staffInitialized;

  const taskStats = useMemo(() => {
    const today = startOfToday();
    const overdue = tasks.filter(t => new Date(t.dueDate) < today && t.status !== 'Completed').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const dueToday = tasks.filter(t => isSameDay(new Date(t.dueDate), today)).length;
    
    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<Task['status'], number>);
    
    return { overdue, completed, dueToday, statusCounts };
  }, [tasks]);

  const chartData = useMemo(() => [
      { name: 'Pending', value: taskStats.statusCounts.Pending || 0, fill: 'hsl(var(--chart-2))' },
      { name: 'In Progress', value: taskStats.statusCounts['In Progress'] || 0, fill: 'hsl(var(--chart-1))' },
      { name: 'Completed', value: taskStats.statusCounts.Completed || 0, fill: 'hsl(var(--chart-3))' },
  ], [taskStats.statusCounts]);

  const chartConfig = {
      tasks: { label: "Tasks" },
      Pending: { label: "Pending", color: "hsl(var(--chart-2))" },
      'In Progress': { label: "In Progress", color: "hsl(var(--chart-1))" },
      Completed: { label: "Completed", color: "hsl(var(--chart-3))" },
  };

  const kanbanColumns: Task['status'][] = ['Pending', 'In Progress', 'Completed'];

  const tasksByStatus = useMemo(() => {
    return tasks.reduce((acc, task) => {
      (acc[task.status] = acc[task.status] || []).push(task);
      return acc;
    }, {} as Record<Task['status'], Task[]>);
  }, [tasks]);
  
  const tasksForSelectedDate = useMemo(() => {
      if (!selectedDate) return [];
      return tasks.filter(task => isSameDay(new Date(task.dueDate), selectedDate));
  }, [tasks, selectedDate]);
  
  const calendarModifiers = {
      due: tasks.map(task => new Date(task.dueDate))
  }
  const calendarModifierStyles = {
      due: {
          color: 'hsl(var(--primary))',
          fontWeight: 'bold',
          textDecoration: 'underline'
      }
  }

  if (!isDataReady) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading Task Manager...</p>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Organize, assign, and track all your team's tasks.</p>
          </div>
          <Button onClick={() => setIsAddTaskModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-destructive">{taskStats.overdue}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{taskStats.dueToday}</div>
                <p className="text-xs text-muted-foreground">Deadlines for today</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <p className="text-xs text-muted-foreground">Total tasks finished</p>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="kanban">
            <TabsList>
                <TabsTrigger value="kanban"><LayoutDashboard className="mr-2 h-4 w-4" />Kanban Board</TabsTrigger>
                <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List View</TabsTrigger>
                <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4" />Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="kanban" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kanbanColumns.map(status => (
                        <div key={status} className="bg-muted/50 rounded-lg p-4">
                            <h3 className="font-semibold mb-4">{status} <Badge variant="secondary" className="ml-2">{tasksByStatus[status]?.length || 0}</Badge></h3>
                            <div className="space-y-4 h-[60vh] overflow-y-auto">
                               {tasksByStatus[status]?.length > 0 ? (
                                tasksByStatus[status].map(task => (
                                    <TaskCard key={task.id} task={task} staffList={staffList} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                                ))
                               ) : (<p className="text-sm text-center text-muted-foreground pt-10">No tasks here.</p>)}
                            </div>
                        </div>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="list" className="pt-4">
                 <Card>
                    <CardContent className="p-0">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Assigned To</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {tasks.length > 0 ? tasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                                <TableCell><Badge variant={priorityBadgeVariant[task.priority]}>{task.priority}</Badge></TableCell>
                                <TableCell>{format(new Date(task.dueDate), 'dd MMM, yyyy')}</TableCell>
                                <TableCell>
                                    <div className="flex -space-x-2">
                                        {staffList.filter(s => task.assignedTo.includes(s.id)).map(s => (
                                            <Badge key={s.id}>{s.name}</Badge>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                           )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No tasks found.</TableCell>
                            </TableRow>
                           )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="calendar" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card>
                    <CardContent className="p-1">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="w-full"
                            modifiers={calendarModifiers}
                            modifiersStyles={calendarModifierStyles}
                        />
                    </CardContent>
                   </Card>
                   <Card>
                       <CardHeader>
                           <CardTitle>Tasks due on {selectedDate ? format(selectedDate, 'PPP') : '...'}</CardTitle>
                       </CardHeader>
                       <CardContent>
                          <div className="space-y-4 h-[60vh] overflow-y-auto">
                               {tasksForSelectedDate.length > 0 ? (
                                tasksForSelectedDate.map(task => (
                                    <TaskCard key={task.id} task={task} staffList={staffList} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
                                ))
                               ) : (<p className="text-sm text-center text-muted-foreground pt-10">No tasks due on this date.</p>)}
                            </div>
                       </CardContent>
                   </Card>
                </div>
            </TabsContent>
        </Tabs>

      </div>
       <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
        onTaskAdded={(newTask) => useTaskStore.getState().addTask(newTask)}
      />
    </>
  );
}
