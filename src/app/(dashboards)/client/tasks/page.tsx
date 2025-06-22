'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, List, Calendar as CalendarIcon, LayoutDashboard, BarChart2, Loader2, Users } from 'lucide-react';
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
import { TaskDetailsModal } from '@/components/task-details-modal';


const priorityBadgeVariant = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline"
} as const;

export default function TaskManagementPage() {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { tasks, addTask, isInitialized: tasksInitialized } = useTaskStore();
  const { staffList, isInitialized: staffInitialized } = useStaffStore();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [taskStats, setTaskStats] = useState({ overdue: 0, completed: 0, dueToday: 0 });
  
  useEffect(() => {
    // This runs only on the client, after hydration
    setSelectedDate(new Date());
  }, []);
  
  const isDataReady = tasksInitialized && staffInitialized;

  useEffect(() => {
    if (isDataReady) {
        const today = startOfToday();
        const overdue = tasks.filter(t => new Date(t.dueDate) < today && t.status !== 'Completed').length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const dueToday = tasks.filter(t => isSameDay(new Date(t.dueDate), today)).length;
        setTaskStats({ overdue, completed, dueToday });
    }
  }, [tasks, isDataReady]);


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

  // Simulating admin/manager as the current user
  const currentUser = staffList.find(s => s.id === 'KM-003') || staffList[0];

  const handleTaskAdded = (newTask: Omit<Task, 'id' | 'createdAt' | 'status' | 'activity'>) => {
    if (currentUser) {
      addTask(newTask, currentUser);
    }
  };


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
                                    <TaskCard key={task.id} task={task} staffList={staffList} onClick={() => setSelectedTask(task)} />
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
                            <TableRow key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer">
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                                <TableCell><Badge variant={priorityBadgeVariant[task.priority]}>{task.priority}</Badge></TableCell>
                                <TableCell>{format(new Date(task.dueDate), 'dd MMM, yyyy')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                         <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{task.assignedTo.length} member(s)</span>
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
                                    <TaskCard key={task.id} task={task} staffList={staffList} onClick={() => setSelectedTask(task)} />
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
        onTaskAdded={handleTaskAdded}
      />
      {selectedTask && currentUser && (
        <TaskDetailsModal
            isOpen={!!selectedTask}
            onOpenChange={() => setSelectedTask(null)}
            task={selectedTask}
            currentUser={currentUser}
        />
      )}
    </>
  );
}
