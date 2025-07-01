
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Student, type Attendance, initialAttendance } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';
import { format } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `student_attendance_${clientId}` : null;

interface StudentAttendanceContextType {
  attendance: Attendance[];
  markAttendance: (student: Student) => 'in' | 'out';
  isInitialized: boolean;
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
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
        const data = storedData ? JSON.parse(storedData) : initialAttendance;
        setAttendance(data);
        if(!storedData) {
            localStorage.setItem(storeKey, JSON.stringify(data));
        }
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
      const today = format(new Date(), 'yyyy-MM-dd');
      const time = new Date().toISOString();
      let punchTypeResult: 'in' | 'out' = 'in';

      setAttendance(currentAttendance => {
        const recordIndex = currentAttendance.findIndex(
          record => record.personId === student.id && record.date === today
        );
        
        const existingRecord = recordIndex !== -1 ? currentAttendance[recordIndex] : null;
        punchTypeResult = (existingRecord && existingRecord.inTime && !existingRecord.outTime) ? 'out' : 'in';

        const newAttendance = [...currentAttendance];

        if (recordIndex > -1) {
            if(punchTypeResult === 'out') {
              newAttendance[recordIndex].outTime = time;
            } else {
              newAttendance[recordIndex].inTime = time;
              newAttendance[recordIndex].outTime = null;
            }
        } else {
            const newRecord: Attendance = {
                personId: student.id,
                date: today,
                inTime: time,
                outTime: null,
            };
            newAttendance.push(newRecord);
        }
        
        return newAttendance;
      });

      return punchTypeResult;
  }, []);
  
  return (
    <StudentAttendanceContext.Provider value={{ attendance, markAttendance, isInitialized, setAttendance }}>
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
