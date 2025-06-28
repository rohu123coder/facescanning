'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff, type Attendance } from '@/lib/data';
import { useClientStore } from './use-client-store';
import { format } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `attendance_${clientId}` : null;

export function useAttendanceStore() {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        if (storedData) {
          setAttendance(JSON.parse(storedData));
        } else {
          setAttendance([]);
        }
      } catch (error) {
        console.error("Failed to load attendance from localStorage", error);
        setAttendance([]);
      }
    } else {
        setAttendance([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const updateAttendanceList = useCallback((newList: Attendance[]) => {
    if (storeKey) {
        setAttendance(newList);
        try {
            localStorage.setItem(storeKey, JSON.stringify(newList));
        } catch (error) {
            console.error("Failed to save attendance to localStorage", error);
        }
    }
  }, [storeKey]);


  const markAttendance = useCallback((staffMember: Staff): 'in' | 'out' => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const time = now.toISOString();
      let punchTypeResult: 'in' | 'out' = 'in';
      
      const currentAttendance = [...attendance];
      const existingRecordIndex = currentAttendance.findIndex(
        record => record.staffId === staffMember.id && record.date === today
      );

      if (existingRecordIndex > -1) {
          currentAttendance[existingRecordIndex].outTime = time;
          punchTypeResult = 'out';
      } else {
          const newRecord: Attendance = {
              staffId: staffMember.id,
              staffName: staffMember.name,
              date: today,
              inTime: time,
              outTime: null,
          };
          currentAttendance.push(newRecord);
          punchTypeResult = 'in';
      }
      
      updateAttendanceList(currentAttendance);
      return punchTypeResult;
  }, [attendance, updateAttendanceList]);

  return { attendance, markAttendance, isInitialized };
}
