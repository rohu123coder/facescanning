
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Task, type Comment, initialTasks } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `taskList_${clientId}` : null;

interface TaskContextType {
  tasks: Task[];
  addTask: (newTaskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (updatedTaskData: Task) => void;
  deleteTask: (taskId: string) => void;
  addCommentToTask: (taskId: string, newCommentData: Omit<Comment, 'id' | 'timestamp'>) => void;
  isInitialized: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedTasks = localStorage.getItem(storeKey);
        const data = storedTasks ? JSON.parse(storedTasks) : initialTasks;
        setTasks(data);
        if (!storedTasks) {
          localStorage.setItem(storeKey, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to load tasks from localStorage", error);
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
    if (storeKey && isInitialized) {
        localStorage.setItem(storeKey, JSON.stringify(tasks));
    }
  }, [tasks, storeKey, isInitialized]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    setTasks(prevTasks => {
      const newTask: Task = {
        ...newTaskData,
        id: `T-${Date.now()}`,
        status: 'To Do',
        createdAt: new Date().toISOString(),
        attachments: newTaskData.attachments || [],
        comments: [],
      };
       // Dispatch notification for new task assignment
      if (newTask.assignedTo && newTask.assignedTo.length > 0) {
        window.dispatchEvent(new CustomEvent('new-task-assigned', {
            detail: {
                taskTitle: newTask.title,
                assigneeIds: newTask.assignedTo,
            }
        }));
      }
      return [...prevTasks, newTask];
    });
  }, []);

  const updateTask = useCallback((updatedTaskData: Task) => {
    setTasks(prevTasks => {
      return prevTasks.map(task =>
        task.id === updatedTaskData.id ? updatedTaskData : task
      );
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      return prevTasks.filter(task => task.id !== taskId);
    });
  }, []);
  
  const addCommentToTask = useCallback((taskId: string, newCommentData: Omit<Comment, 'id' | 'timestamp'>) => {
    setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
            if (task.id === taskId) {
                const newComment: Comment = {
                    ...newCommentData,
                    id: `COMM-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                };
                const updatedComments = [...(task.comments || []), newComment];
                
                window.dispatchEvent(new CustomEvent('new-task-comment', { 
                    detail: { 
                        taskId: taskId,
                        taskTitle: task.title,
                        authorId: newCommentData.authorId,
                        authorName: newCommentData.authorName,
                        recipientIds: [...task.assignedTo, 'client-admin']
                    } 
                }));

                return { ...task, comments: updatedComments };
            }
            return task;
        });
        return newTasks;
    });
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, addCommentToTask, isInitialized }}>
      {children}
    </TaskContext.Provider>
  );
}


export function useTaskStore() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskStore must be used within a TaskProvider');
  }
  return context;
}
