'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff, type Attendance, initialAttendance } from '@/lib/data';
import { useClientStore } from './use-client-store';
import { format } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `attendance_${clientId}` : null;

interface AttendanceContextType {
  attendance: Attendance[];
  markAttendance: (staffMember: Staff) => 'in' | 'out';
  isInitialized: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const storeKey = getStoreKey(currentClient?.id);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        setAttendance(storedData ? JSON.parse(storedData) : initialAttendance);
      } catch (error) {
        console.error("Failed to load attendance from localStorage", error);
        setAttendance(initialAttendance);
      }
    } else {
        setAttendance([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const markAttendance = useCallback((staffMember: Staff): 'in' | 'out' => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const now = new Date().toISOString();

    const existingRecordIndex = attendance.findIndex(
      (record) => record.personId === staffMember.id && record.date === todayString
    );

    let punchType: 'in' | 'out';
    const newAttendance = [...attendance];

    if (existingRecordIndex !== -1) {
      const record = newAttendance[existingRecordIndex];
      if (record.inTime && !record.outTime) {
        // Clocking out
        punchType = 'out';
        newAttendance[existingRecordIndex] = { ...record, outTime: now };
      } else {
        // Clocking in again
        punchType = 'in';
        newAttendance[existingRecordIndex] = { ...record, inTime: now, outTime: null };
      }
    } else {
      // First clock-in of the day
      punchType = 'in';
      newAttendance.push({
        personId: staffMember.id,
        date: todayString,
        inTime: now,
        outTime: null,
      });
    }

    setAttendance(newAttendance);
    if (storeKey) {
      localStorage.setItem(storeKey, JSON.stringify(newAttendance));
    }
    return punchType;
  }, [attendance, storeKey]);


  return (
    <AttendanceContext.Provider value={{ attendance, markAttendance, isInitialized }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendanceStore() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendanceStore must be used within an AttendanceProvider');
  }
  return context;
}
