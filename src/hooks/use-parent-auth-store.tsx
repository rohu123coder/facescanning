
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Student, type Client, initialClients } from '@/lib/data';

const PARENT_AUTH_KEY = 'loggedInParentMobile';
const STUDENT_FOR_PARENT_KEY = 'loggedInStudentId';
const CLIENT_FOR_PARENT_KEY = 'loggedInParentClientId';

const ALL_CLIENTS_KEY = 'clientList';
const STUDENT_LIST_KEY_PREFIX = 'studentList_';


interface ParentAuthContextType {
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  student: Student | null;
  login: (parentMobile: string, rollNumber: string) => Promise<{ success: boolean; message?: string; studentName?: string; }>;
  logout: () => void;
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined);

export function ParentAuthStoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  const loadParentData = useCallback(() => {
    try {
      const parentMobile = localStorage.getItem(PARENT_AUTH_KEY);
      const studentId = localStorage.getItem(STUDENT_FOR_PARENT_KEY);
      const clientId = localStorage.getItem(CLIENT_FOR_PARENT_KEY);
      
      if (parentMobile && studentId && clientId) {
        const studentListJSON = localStorage.getItem(`${STUDENT_LIST_KEY_PREFIX}${clientId}`);
        if (studentListJSON) {
          const studentList: Student[] = JSON.parse(studentListJSON);
          const loggedInStudent = studentList.find(s => s.id === studentId && s.parentMobile === parentMobile);
          if (loggedInStudent) {
            setStudent(loggedInStudent);
            setIsAuthenticated(true);
            return;
          }
        }
      }
      // If anything fails, clear auth state
      localStorage.removeItem(PARENT_AUTH_KEY);
      localStorage.removeItem(STUDENT_FOR_PARENT_KEY);
      localStorage.removeItem(CLIENT_FOR_PARENT_KEY);
      setStudent(null);
      setIsAuthenticated(false);

    } catch (error) {
      console.error("Failed to load parent data", error);
      setIsAuthenticated(false);
      setStudent(null);
    }
  }, []);

  useEffect(() => {
    loadParentData();
    setIsAuthInitialized(true);
  }, [loadParentData]);

  const login = useCallback(async (parentMobile: string, rollNumber: string): Promise<{ success: boolean; message?: string; studentName?: string; }> => {
    try {
      const allClientsJSON = localStorage.getItem(ALL_CLIENTS_KEY);
      const allClients: Client[] = allClientsJSON ? JSON.parse(allClientsJSON) : initialClients;

      for (const client of allClients) {
        const studentListJSON = localStorage.getItem(`${STUDENT_LIST_KEY_PREFIX}${client.id}`);
        if (studentListJSON) {
          const studentList: Student[] = JSON.parse(studentListJSON);
          const foundStudent = studentList.find(s => s.parentMobile === parentMobile && s.rollNumber === rollNumber);
          
          if (foundStudent) {
            localStorage.setItem(PARENT_AUTH_KEY, foundStudent.parentMobile);
            localStorage.setItem(STUDENT_FOR_PARENT_KEY, foundStudent.id);
            localStorage.setItem(CLIENT_FOR_PARENT_KEY, client.id);
            
            // This is key for making other hooks work (like attendance store)
            localStorage.setItem('loggedInClientId', client.id);
            
            setStudent(foundStudent);
            setIsAuthenticated(true);
            return { success: true, studentName: foundStudent.name };
          }
        }
      }
      return { success: false, message: "Mobile number or roll number is incorrect." };
    } catch (error) {
      console.error("Parent login failed", error);
      return { success: false, message: "An error occurred during login." };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(PARENT_AUTH_KEY);
      localStorage.removeItem(STUDENT_FOR_PARENT_KEY);
      localStorage.removeItem(CLIENT_FOR_PARENT_KEY);
      localStorage.removeItem('loggedInClientId');
      setIsAuthenticated(false);
      setStudent(null);
      window.location.assign('/parent-login');
    } catch (error) {
      console.error("Failed to logout parent", error);
    }
  }, []);

  const value = { isAuthenticated, isAuthInitialized, student, login, logout };

  return (
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  );
}

export function useParentAuthStore() {
  const context = useContext(ParentAuthContext);
  if (context === undefined) {
    throw new Error('useParentAuthStore must be used within a ParentAuthStoreProvider');
  }
  return context;
}
