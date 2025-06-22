'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Task, initialTasks } from '@/lib/data';
import { useToast } from './use-toast';

const STORE_KEY = 'taskList';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(STORE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks(initialTasks);
        localStorage.setItem(STORE_KEY, JSON.stringify(initialTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      setTasks(initialTasks);
    }
    setIsInitialized(true);
  }, []);

  const updateTaskList = useCallback((newList: Task[]) => {
    // Sort tasks by creation date, newest first
    const sortedList = newList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTasks(sortedList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save tasks to localStorage", error);
    }
  }, []);

  const addTask = useCallback((newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const newIdNumber = tasks.length > 0 ? Math.max(0, ...tasks.map(t => parseInt(t.id.split('-')[1], 10))) + 1 : 1;
    const newId = `TASK-${String(newIdNumber).padStart(3, '0')}`;
    const taskToAdd: Task = { 
        ...newTask, 
        id: newId, 
        createdAt: new Date().toISOString()
    };
    
    updateTaskList([taskToAdd, ...tasks]);
    toast({
        title: 'Task Created',
        description: `Task "${taskToAdd.title}" has been successfully created.`,
    });
  }, [tasks, updateTaskList, toast]);

  const updateTask = useCallback((updatedTaskData: Task) => {
    const updatedList = tasks.map(task => 
      task.id === updatedTaskData.id ? updatedTaskData : task
    );
    updateTaskList(updatedList);
  }, [tasks, updateTaskList]);
  
  const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({ ...task, status: newStatus });
       toast({
        title: 'Task Updated',
        description: `Task "${task.title}" moved to ${newStatus}.`,
      });
    }
  }, [tasks, updateTask, toast]);

  const deleteTask = useCallback((taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    const updatedList = tasks.filter(task => task.id !== taskId);
    updateTaskList(updatedList);
     toast({
        variant: 'destructive',
        title: 'Task Deleted',
        description: `Task "${taskToDelete?.title}" has been successfully removed.`,
    });
  }, [tasks, updateTaskList, toast]);

  return { tasks, setTasks, addTask, updateTask, updateTaskStatus, deleteTask, isInitialized };
}

    