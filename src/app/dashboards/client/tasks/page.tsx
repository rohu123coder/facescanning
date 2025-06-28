'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle, ListTodo, CircleEllipsis } from 'lucide-react';
import { AddTaskModal } from '@/components/add-task-modal';
import { TaskDetailsModal } from '@/components/task-details-modal';
import { useTaskStore } from '@/hooks/use-task-store';
import { type Task, type TaskStatus } from '@/lib/data';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { TaskColumn } from '@/components/task-column';

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
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag to start
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    const overContainerId = over.data.current?.sortable.containerId;

    // Determine the new status. It can be the ID of the droppable container
    // or the container ID of the sortable item we're dropping over.
    const newStatus = (overContainerId || over.id) as TaskStatus;
    
    // Validate if newStatus is a valid column status
    const isValidStatus = statusColumns.some(c => c.status === newStatus);

    if (isValidStatus && task.status !== newStatus) {
      updateTask({ ...task, status: newStatus });
    }
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

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {isInitialized ? statusColumns.map(({ status, title, icon }) => (
                <TaskColumn
                    key={status}
                    status={status}
                    title={title}
                    icon={icon}
                    tasks={getTasksByStatus(status)}
                    onSelectTask={handleViewTask}
                    onUpdateTask={updateTask}
                />
            )) : (
                <p>Loading tasks...</p>
            )}
            </div>
        </DndContext>
      </div>
      <AddTaskModal isOpen={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen} />
      <TaskDetailsModal isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} task={selectedTask} />
    </>
  );
}
