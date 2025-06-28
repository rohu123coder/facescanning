'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';
import { type Task } from '@/lib/data';

interface SortableTaskCardProps {
  task: Task;
  onSelectTask: (task: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export function SortableTaskCard({ task, onSelectTask, onUpdateTask }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1 : 'auto',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onSelectTask={onSelectTask} onUpdateTask={onUpdateTask} />
    </div>
  );
}
