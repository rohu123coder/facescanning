
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import type { Task } from '@/lib/data';
import { EmployeeTaskDetailsModal } from '@/components/employee-task-details-modal';
import { TaskCard } from '@/components/task-card';
import { CheckSquare } from 'lucide-react';

export default function MyTasksPage() {
  const { employee } = useEmployeeAuthStore();
  const { tasks, updateTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!employee) {
    return <div>Loading...</div>;
  }

  const myTasks = tasks.filter(task => task.assignedTo.includes(employee.id))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks.</p>
        </div>
        
        {myTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onSelectTask={handleSelectTask}
                onUpdateTask={updateTask}
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
              <div className="mx-auto bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckSquare className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="mt-4">All Caught Up!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You have no tasks assigned to you at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EmployeeTaskDetailsModal
        isOpen={!!selectedTask}
        onOpenChange={(isOpen) => { if (!isOpen) setSelectedTask(null) }}
        task={selectedTask}
      />
    </>
  );
}
