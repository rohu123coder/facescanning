
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Student, type Attendance } from '@/lib/data';
import { useClientStore } from './use-client-store';
import { format } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `student_attendance_${clientId}` : null;

interface StudentAttendanceContextType {
  attendance: Attendance[];
  markAttendance: (student: Student) => 'in' | 'out';
  isInitialized: boolean;
}

const StudentAttendanceContext = createContext<StudentAttendanceContextType | undefined>(undefined);

export function StudentAttendanceProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        setAttendance(storedData ? JSON.parse(storedData) : []);
      } catch (error) {
        console.error("Failed to load student attendance from localStorage", error);
        setAttendance([]);
      }
    } else {
        setAttendance([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
    if (storeKey && isInitialized) {
        localStorage.setItem(storeKey, JSON.stringify(attendance));
    }
  }, [attendance, storeKey, isInitialized]);


  const markAttendance = useCallback((student: Student): 'in' | 'out' => {
      let punchTypeResult: 'in' | 'out' = 'in';
      
      setAttendance(prevAttendance => {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const time = now.toISOString();
        
        const currentAttendance = [...prevAttendance];
        const existingRecordIndex = currentAttendance.findIndex(
          record => record.personId === student.id && record.date === today
        );

        if (existingRecordIndex > -1) {
            const existingRecord = currentAttendance[existingRecordIndex];
            if(existingRecord.inTime && !existingRecord.outTime) {
              currentAttendance[existingRecordIndex].outTime = time;
              punchTypeResult = 'out';
            } else {
              currentAttendance[existingRecordIndex].inTime = time;
              currentAttendance[existingRecordIndex].outTime = null;
              punchTypeResult = 'in';
            }
        } else {
            const newRecord: Attendance = {
                personId: student.id,
                date: today,
                inTime: time,
                outTime: null,
            };
            currentAttendance.push(newRecord);
            punchTypeResult = 'in';
        }
        
        return currentAttendance;
      });

      return punchTypeResult;
  }, []);
  
  return (
    <StudentAttendanceContext.Provider value={{ attendance, markAttendance, isInitialized }}>
      {children}
    </StudentAttendanceContext.Provider>
  );
}

export function useStudentAttendanceStore() {
  const context = useContext(StudentAttendanceContext);
  if (context === undefined) {
    throw new Error('useStudentAttendanceStore must be used within a StudentAttendanceProvider');
  }
  return context;
}
