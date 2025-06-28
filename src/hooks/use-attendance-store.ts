// This file has been repurposed as use-student-attendance-store.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Student, type Attendance, initialAttendance } from '@/lib/data';
import { useClientStore } from './use-client-store';
import { format } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `student_attendance_${clientId}` : null;

export function useStudentAttendanceStore() {
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
          setAttendance(initialAttendance);
        }
      } catch (error) {
        console.error("Failed to load attendance from localStorage", error);
        setAttendance(initialAttendance);
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


  const markAttendance = useCallback((student: Student): 'in' | 'out' => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const time = now.toISOString();
      let punchTypeResult: 'in' | 'out' = 'in';
      
      const currentAttendance = [...attendance];
      const existingRecordIndex = currentAttendance.findIndex(
        record => record.personId === student.id && record.date === today
      );

      if (existingRecordIndex > -1) {
          const existingRecord = currentAttendance[existingRecordIndex];
          // If inTime is present and outTime is not, mark outTime
          if(existingRecord.inTime && !existingRecord.outTime) {
            currentAttendance[existingRecordIndex].outTime = time;
            punchTypeResult = 'out';
          } else {
            // If already marked out, or something is wrong, just mark in again (override)
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
      
      updateAttendanceList(currentAttendance);
      return punchTypeResult;
  }, [attendance, updateAttendanceList]);

  return { attendance, markAttendance, isInitialized };
}
