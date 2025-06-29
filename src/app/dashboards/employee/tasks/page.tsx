
'use client';

import { useState, useMemo } from 'react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useTaskStore } from '@/hooks/use-task-store';
import { type Task, type TaskStatus } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeTaskDetailsModal } from '@/components/employee-task-details-modal';
import { TaskCard } from '@/components/task-card';

const statusTabs: { status: TaskStatus, label: string }[] = [
    { status: 'To Do', label: 'To Do' },
    { status: 'In Progress', label: 'In Progress' },
    { status: 'Done', label: 'Done' }
];

export default function MyTasksPage() {
    const { currentEmployeeId } = useEmployeeAuthStore();
    const { tasks, isInitialized, updateTask } = useTaskStore();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const myTasks = useMemo(() => {
        if (!isInitialized || !currentEmployeeId) return [];
        return tasks.filter(task => task.assignedTo.includes(currentEmployeeId));
    }, [tasks, currentEmployeeId, isInitialized]);

    const handleSelectTask = (task: Task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
                    <p className="text-muted-foreground">Here are the tasks that have been assigned to you.</p>
                </div>

                <Tabs defaultValue="To Do" className="w-full">
                    <TabsList>
                        {statusTabs.map(tab => (
                            <TabsTrigger key={tab.status} value={tab.status}>
                                {tab.label} ({myTasks.filter(t => t.status === tab.status).length})
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {statusTabs.map(tab => (
                        <TabsContent key={tab.status} value={tab.status}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{tab.label} Tasks</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {myTasks.filter(t => t.status === tab.status).length > 0 ? (
                                        myTasks
                                            .filter(t => t.status === tab.status)
                                            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                            .map(task => (
                                                <TaskCard 
                                                    key={task.id}
                                                    task={task}
                                                    onSelectTask={handleSelectTask}
                                                    onUpdateTask={updateTask}
                                                />
                                            ))
                                    ) : (
                                        <div className="flex items-center justify-center h-24 text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                                            <p>No tasks in this category.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            <EmployeeTaskDetailsModal
                isOpen={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                task={selectedTask}
            />
        </>
    );
}
