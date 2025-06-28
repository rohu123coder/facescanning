'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Task, initialTasks } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `taskList_${clientId}` : null;

export function useTaskStore() {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedTasks = localStorage.getItem(storeKey);
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        } else {
          setTasks(initialTasks);
          localStorage.setItem(storeKey, JSON.stringify(initialTasks));
        }
      } catch (error) {
        console.error("Failed to load tasks from localStorage", error);
        setTasks(initialTasks);
      }
    } else {
      setTasks([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const updateTaskList = useCallback((newList: Task[]) => {
    if (storeKey) {
      setTasks(newList);
      try {
        localStorage.setItem(storeKey, JSON.stringify(newList));
      } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
      }
    }
  }, [storeKey]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `T-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTaskList([...tasks, newTask]);
  }, [tasks, updateTaskList]);

  const updateTask = useCallback((updatedTaskData: Task) => {
    const updatedList = tasks.map(task =>
      task.id === updatedTaskData.id ? updatedTaskData : task
    );
    updateTaskList(updatedList);
  }, [tasks, updateTaskList]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedList = tasks.filter(task => task.id !== taskId);
    updateTaskList(updatedList);
  }, [tasks, updateTaskList]);

  return { tasks, addTask, updateTask, deleteTask, isInitialized };
}
