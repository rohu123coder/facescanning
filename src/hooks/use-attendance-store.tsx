
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
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
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
    let punchTypeResult: 'in' | 'out' = 'in';

    setAttendance(currentAttendance => {
        const recordIndex = currentAttendance.findIndex(
            (record) => record.personId === staffMember.id && record.date === todayString
        );

        const existingRecord = recordIndex !== -1 ? currentAttendance[recordIndex] : null;
        punchTypeResult = (existingRecord && existingRecord.inTime && !existingRecord.outTime) ? 'out' : 'in';

        const newAttendance = [...currentAttendance];

        if (recordIndex !== -1) {
            if (punchTypeResult === 'out') {
                newAttendance[recordIndex] = { ...newAttendance[recordIndex], outTime: nowISO };
            } else {
                newAttendance[recordIndex] = { ...newAttendance[recordIndex], inTime: nowISO, outTime: null };
            }
        } else {
            newAttendance.push({
                personId: staffMember.id,
                date: todayString,
                inTime: nowISO,
                outTime: null,
            });
        }
        return newAttendance;
    });

    return punchTypeResult;
  }, []);

  return (
    <AttendanceContext.Provider value={{ attendance, markAttendance, isInitialized, setAttendance }}>
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
