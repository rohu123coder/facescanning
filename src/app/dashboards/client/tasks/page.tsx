'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle, ListTodo, CircleEllipsis } from 'lucide-react';
import { AddTaskModal } from '@/components/add-task-modal';
import { TaskDetailsModal } from '@/components/task-details-modal';
import { useTaskStore } from '@/hooks/use-task-store';
import { TaskCard } from '@/components/task-card';
import type { Task, TaskStatus } from '@/lib/data';

const statusColumns: { status: TaskStatus; title: string; icon: React.ReactNode }[] = [
  { status: 'To Do', title: 'To Do', icon: <ListTodo /> },
  { status: 'In Progress', title: 'In Progress', icon: <CircleEllipsis /> },
  { status: 'Done', title: 'Done', icon: <CheckCircle /> },
];

export default function TasksPage() {
  const { tasks, isInitialized, updateTask } = useTaskStore();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };
  
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };
  
  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Task Management</h1>
            <p className="text-muted-foreground">Organize, assign, and track your team's work.</p>
          </div>
          <Button onClick={() => setIsAddTaskModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {statusColumns.map(({ status, title, icon }) => (
            <div key={status} className="bg-muted/50 rounded-lg h-full">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="font-semibold">{title}</h2>
                </div>
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {getTasksByStatus(status).length}
                </span>
              </div>
              <div className="p-4 space-y-4 h-full">
                {isInitialized ? (
                    getTasksByStatus(status).length > 0 ? (
                        getTasksByStatus(status)
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map(task => (
                            <TaskCard 
                              key={task.id} 
                              task={task} 
                              onSelectTask={handleViewTask}
                              onUpdateTask={updateTask}
                            />
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No tasks in this column.
                        </div>
                    )
                ) : (
                    <p>Loading tasks...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <AddTaskModal isOpen={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen} />
      <TaskDetailsModal isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} task={selectedTask} />
    </>
  );
}
