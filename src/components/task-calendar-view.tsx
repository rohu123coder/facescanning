'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { type Task } from '@/lib/data';
import { format, startOfDay } from 'date-fns';
import { TaskCard } from './task-card';

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskCalendarView({ tasks, onSelectTask }: TaskCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const dateKey = format(startOfDay(new Date(task.dueDate)), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(task);
    });
    return map;
  }, [tasks]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(startOfDay(selectedDate), 'yyyy-MM-dd');
    return (tasksByDate.get(dateKey) || []).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [selectedDate, tasksByDate]);

  const taskDayModifiers = useMemo(() => {
    const datesWithTasks: Date[] = [];
    tasksByDate.forEach((_, dateKey) => {
      // Add a day to correct for timezone offset issues when creating Date from 'yyyy-MM-dd'
      const date = new Date(dateKey);
      const tzCorrectedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
      datesWithTasks.push(tzCorrectedDate);
    });
    return {
      hasTasks: datesWithTasks,
    };
  }, [tasksByDate]);

  return (
    <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={taskDayModifiers}
                    modifiersClassNames={{
                        hasTasks: 'has-tasks',
                    }}
                />
                <style>{`
                    .has-tasks:not([aria-selected]) { 
                        font-weight: bold; 
                        position: relative;
                    }
                    .has-tasks:not([aria-selected])::after {
                        content: '';
                        position: absolute;
                        bottom: 4px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 4px;
                        height: 4px;
                        border-radius: 50%;
                        background-color: hsl(var(--primary));
                    }
                `}</style>
            </div>
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold font-headline">
                    Tasks for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                </h3>
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                    {tasksForSelectedDate.length > 0 ? (
                        tasksForSelectedDate.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onSelectTask={onSelectTask}
                                onUpdateTask={() => {}} // Status update is done on board view
                                showActions={false}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-40 text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <p>No tasks due on this day.</p>
                        </div>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
