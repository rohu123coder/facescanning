
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Task, initialTasks } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `taskList_${clientId}` : null;

interface TaskContextType {
  tasks: Task[];
  addTask: (newTaskData: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (updatedTaskData: Task) => void;
  deleteTask: (taskId: string) => void;
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
        setTasks(storedTasks ? JSON.parse(storedTasks) : initialTasks);
      } catch (error) {
        console.error("Failed to load tasks from localStorage", error);
        setTasks(initialTasks);
      }
    } else {
      setTasks([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prevTasks => {
      const newTask: Task = {
        ...newTaskData,
        id: `T-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const newList = [...prevTasks, newTask];
      if (storeKey) localStorage.setItem(storeKey, JSON.stringify(newList));
      return newList;
    });
  }, [storeKey]);

  const updateTask = useCallback((updatedTaskData: Task) => {
    setTasks(prevTasks => {
      const updatedList = prevTasks.map(task =>
        task.id === updatedTaskData.id ? updatedTaskData : task
      );
      if (storeKey) localStorage.setItem(storeKey, JSON.stringify(updatedList));
      return updatedList;
    });
  }, [storeKey]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updatedList = prevTasks.filter(task => task.id !== taskId);
      if (storeKey) localStorage.setItem(storeKey, JSON.stringify(updatedList));
      return updatedList;
    });
  }, [storeKey]);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, isInitialized }}>
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
