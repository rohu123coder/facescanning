
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Student, initialStudents } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `studentList_${clientId}` : null;

interface StudentContextType {
  students: Student[];
  addStudent: (newStudentData: Omit<Student, 'id' | 'joiningDate' | 'status'>) => void;
  updateStudent: (updatedStudentData: Student) => void;
  deleteStudent: (studentId: string) => void;
  isInitialized: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const storeKey = getStoreKey(currentClient?.id);

  // Load from localStorage on mount
  useEffect(() => {
    if (storeKey) {
      try {
        const storedStudents = localStorage.getItem(storeKey);
        const data = storedStudents ? JSON.parse(storedStudents) : initialStudents;
        setStudents(data);
        if (!storedStudents) {
          localStorage.setItem(storeKey, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to load students from localStorage", error);
        setStudents([]);
      }
    } else {
        setStudents([]);
    }
    setIsInitialized(true);
  }, [storeKey]);


  // Save to localStorage on change
  useEffect(() => {
    if (storeKey && isInitialized) {
        try {
            localStorage.setItem(storeKey, JSON.stringify(students));
        } catch (error) {
            console.error("Failed to save students to localStorage. Quota may be exceeded.", error);
        }
    }
  }, [students, storeKey, isInitialized]);

  const addStudent = useCallback((newStudentData: Omit<Student, 'id' | 'joiningDate' | 'status'>) => {
    setStudents(prevStudents => {
      const newIdNumber = prevStudents.length > 0 ? Math.max(0, ...prevStudents.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
      const newId = `STU-${String(newIdNumber).padStart(3, '0')}`;
      const studentToAdd: Student = { 
          ...newStudentData, 
          id: newId,
          joiningDate: new Date().toISOString(),
          status: 'Active'
      };
      return [...prevStudents, studentToAdd];
    });
  }, []);

  const updateStudent = useCallback((updatedStudentData: Student) => {
    setStudents(prevStudents => {
      return prevStudents.map(member =>
        member.id === updatedStudentData.id ? updatedStudentData : member
      );
    });
  }, []);
  
  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prevStudents => {
      return prevStudents.filter(member => member.id !== studentId);
    });
  }, []);
  
  return (
    <StudentContext.Provider value={{ students, addStudent, updateStudent, deleteStudent, isInitialized }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudentStore() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentStore must be used within a StudentProvider');
  }
  return context;
}
