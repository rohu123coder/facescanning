'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

  // Load from localStorage on mount
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

  // Save to localStorage on change
  useEffect(() => {
      if (storeKey && isInitialized) {
          localStorage.setItem(storeKey, JSON.stringify(attendance));
      }
  }, [attendance, storeKey, isInitialized]);


  const markAttendance = (staffMember: Staff): 'in' | 'out' => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const now = new Date().toISOString();
    let newAttendanceList: Attendance[];
    let punchType: 'in' | 'out';

    const existingRecord = attendance.find(
      (record) => record.personId === staffMember.id && record.date === todayString
    );

    if (existingRecord && existingRecord.inTime && !existingRecord.outTime) {
      // This is a punch 'out'
      punchType = 'out';
      newAttendanceList = attendance.map(record =>
        record.personId === staffMember.id && record.date === todayString
          ? { ...record, outTime: now }
          : record
      );
    } else {
      // This is a punch 'in' (either new or after punching out)
      punchType = 'in';
      const existingRecordIndex = attendance.findIndex(
        (record) => record.personId === staffMember.id && record.date === todayString
      );

      if (existingRecordIndex !== -1) {
        // Re-punch-in on the same day
        newAttendanceList = [...attendance];
        newAttendanceList[existingRecordIndex] = { ...newAttendanceList[existingRecordIndex], inTime: now, outTime: null };
      } else {
        // First punch-in of the day
        const newRecord: Attendance = {
          personId: staffMember.id,
          date: todayString,
          inTime: now,
          outTime: null,
        };
        newAttendanceList = [...attendance, newRecord];
      }
    }
    
    setAttendance(newAttendanceList);
    return punchType;
  };

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
