
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Student, initialStudents } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `studentList_${clientId}` : null;
const getPhotoKey = (studentId: string) => `photo_${studentId}`;

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
        let loadedStudents = storedStudents ? JSON.parse(storedStudents) : initialStudents;

        // Re-hydrate photo URLs from separate storage
        loadedStudents = loadedStudents.map((student: Student) => {
          const photoData = localStorage.getItem(getPhotoKey(student.id));
          if (photoData) {
            return { ...student, photoUrl: photoData };
          }
          // If initial data, store its photo url for consistency
          if (student.photoUrl) {
              localStorage.setItem(getPhotoKey(student.id), student.photoUrl);
          }
          return student;
        });
        
        setStudents(loadedStudents);

      } catch (error) {
        console.error("Failed to load students from localStorage", error);
        setStudents(initialStudents);
      }
    } else {
        setStudents([]);
    }
    setIsInitialized(true);
  }, [storeKey]);


  // Save to localStorage on change, separating photo data
  useEffect(() => {
    if (storeKey && isInitialized) {
        try {
            const studentsToStore = students.map(student => {
                const { photoUrl, ...rest } = student;
                if (photoUrl && photoUrl.startsWith('data:image')) {
                    // Store large photo data separately
                    localStorage.setItem(getPhotoKey(student.id), photoUrl);
                    // Return student object without photo data for main list
                    return { ...rest, photoUrl: '' }; 
                }
                return student; // Keep existing (placeholder) URLs in the list
            });

            localStorage.setItem(storeKey, JSON.stringify(studentsToStore));
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
    // Also remove the photo from localStorage
    localStorage.removeItem(getPhotoKey(studentId));
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
