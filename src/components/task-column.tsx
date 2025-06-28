'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Task, type TaskStatus } from '@/lib/data';
import { SortableTaskCard } from './sortable-task-card';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export function TaskColumn({ status, title, icon, tasks, onSelectTask, onUpdateTask }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const taskIds = tasks.map(t => t.id);

  return (
    <div className="bg-muted/50 rounded-lg h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold">{title}</h2>
        </div>
        <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {tasks.length}
        </span>
      </div>
      <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="p-4 space-y-4 h-full overflow-y-auto flex-1">
          {tasks.length > 0 ? (
            tasks
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                  onUpdateTask={onUpdateTask}
                />
              ))
          ) : (
            <div className="flex items-center justify-center h-full min-h-[100px] text-center text-sm text-muted-foreground p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <p>Drag tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
