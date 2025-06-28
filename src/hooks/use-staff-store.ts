// This file has been repurposed as use-student-store.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Student, initialStudents } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `studentList_${clientId}` : null;

export function useStudentStore() {
  const { currentClient } = useClientStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const storeKey = getStoreKey(currentClient?.id);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedStudents = localStorage.getItem(storeKey);
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        } else {
          setStudents(initialStudents);
          localStorage.setItem(storeKey, JSON.stringify(initialStudents));
        }
      } catch (error) {
        console.error("Failed to load students from localStorage", error);
        setStudents(initialStudents);
      }
    } else {
        setStudents([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const updateStudentList = useCallback((newList: Student[]) => {
    if (storeKey) {
        setStudents(newList);
        try {
            localStorage.setItem(storeKey, JSON.stringify(newList));
        } catch (error) {
            console.error("Failed to save students to localStorage", error);
        }
    }
  }, [storeKey]);

  const addStudent = useCallback((newStudentData: Omit<Student, 'id'>) => {
    const newIdNumber = students.length > 0 ? Math.max(0, ...students.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `STU-${String(newIdNumber).padStart(3, '0')}`;
    const studentToAdd: Student = { ...newStudentData, id: newId };
    updateStudentList([...students, studentToAdd]);
  }, [students, updateStudentList]);

  const updateStudent = useCallback((updatedStudentData: Student) => {
    const updatedList = students.map(member =>
      member.id === updatedStudentData.id ? updatedStudentData : member
    );
    updateStudentList(updatedList);
  }, [students, updateStudentList]);
  
  const deleteStudent = useCallback((studentId: string) => {
    const updatedList = students.filter(member => member.id !== studentId);
    updateStudentList(updatedList);
  }, [students, updateStudentList]);

  return { students, addStudent, updateStudent, deleteStudent, isInitialized };
}
