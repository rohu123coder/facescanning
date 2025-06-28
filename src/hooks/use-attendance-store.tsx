
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff, type Attendance } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';
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

  // Load from localStorage on mount
  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        // If no data, start with an empty array for a fresh start.
        setAttendance(storedData ? JSON.parse(storedData) : []);
      } catch (error) {
        console.error("Failed to load attendance from localStorage", error);
        setAttendance([]);
      }
    } else {
        setAttendance([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (storeKey && isInitialized) {
      try {
        localStorage.setItem(storeKey, JSON.stringify(attendance));
      } catch (error) {
        console.error("Failed to save attendance to localStorage", error);
      }
    }
  }, [attendance, storeKey, isInitialized]);

  const markAttendance = useCallback((staffMember: Staff): 'in' | 'out' => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const nowISO = new Date().toISOString();
    
    // Determine punch type based on current state *before* updating
    const existingRecordForCheck = attendance.find(
      (record) => record.personId === staffMember.id && record.date === todayString
    );
    const punchType: 'in' | 'out' = (existingRecordForCheck && existingRecordForCheck.inTime && !existingRecordForCheck.outTime) ? 'out' : 'in';

    setAttendance(prevAttendance => {
      const newAttendanceList = [...prevAttendance];
      const recordIndex = newAttendanceList.findIndex(
        (record) => record.personId === staffMember.id && record.date === todayString
      );

      if (recordIndex !== -1) {
        // Record for today exists, so update it
        const existingRecord = newAttendanceList[recordIndex];
        if (punchType === 'out') {
          newAttendanceList[recordIndex] = { ...existingRecord, outTime: nowISO };
        } else { // Re-punching in
          newAttendanceList[recordIndex] = { ...existingRecord, inTime: nowISO, outTime: null };
        }
      } else {
        // No record for today, create a new one
        newAttendanceList.push({
          personId: staffMember.id,
          date: todayString,
          inTime: nowISO,
          outTime: null,
        });
      }
      return newAttendanceList;
    });

    return punchType;
  }, [attendance]);

  return (
    <AttendanceContext.Provider value={{ attendance, markAttendance, isInitialized }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendanceStore() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendanceStore must be used within a AttendanceProvider');
  }
  return context;
}
