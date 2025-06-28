'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff, type AttendanceRecord, initialStaff } from '@/lib/data';
import { parse, formatDistanceStrict } from 'date-fns';

const STORE_KEY = 'staffList';

// Helper to parse time strings like "09:05:30 AM"
const parseTime = (dateStr: string, timeStr: string): Date => {
  return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd h:mm:ss a', new Date());
};

export function useStaffStore() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedStaff = localStorage.getItem(STORE_KEY);
      if (storedStaff) {
        setStaffList(JSON.parse(storedStaff));
      } else {
        // If no data in local storage, seed it with initial data.
        setStaffList(initialStaff);
        localStorage.setItem(STORE_KEY, JSON.stringify(initialStaff));
      }
    } catch (error) {
      console.error("Failed to load staff from localStorage", error);
      setStaffList(initialStaff); // Fallback to initial data on error
    }
    setIsInitialized(true);
  }, []);

  const updateStaffList = useCallback((newList: Staff[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(newList));
    } catch (error) {
      console.error("Failed to save staff to localStorage", error);
    }
  }, []);
  
  const updateStaffAttendance = useCallback((staffId: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    let statusMsg = '';
    const updatedList = staffList.map(staff => {
      if (staff.id !== staffId) {
        return staff;
      }

      const records = staff.attendanceRecords ? [...staff.attendanceRecords] : [];
      const todayRecordIndex = records.findIndex(r => r.date === today);
      let updatedRecord: AttendanceRecord;

      if (todayRecordIndex === -1) {
        // First punch of the day
        updatedRecord = { date: today, inTime: currentTime, outTime: null, totalHours: null };
        statusMsg = 'Clocked In';
        return { ...staff, attendanceRecords: [...records, updatedRecord] };
      }

      // Subsequent punch
      const updatedRecords = [...records];
      const existingRecord = updatedRecords[todayRecordIndex];
      
      const inTimeDate = parseTime(today, existingRecord.inTime!);
      const outTimeDate = parseTime(today, currentTime);
      const totalHours = (!isNaN(inTimeDate.getTime()) && !isNaN(outTimeDate.getTime()))
        ? formatDistanceStrict(outTimeDate, inTimeDate)
        : null;
      
      updatedRecord = { ...existingRecord, outTime: currentTime, totalHours };
      statusMsg = 'Clocked Out';
      
      updatedRecords[todayRecordIndex] = updatedRecord;
      return { ...staff, attendanceRecords: updatedRecords };
    });
    
    updateStaffList(updatedList);
    return statusMsg;

  }, [staffList, updateStaffList]);


  return { staffList, setStaffList, updateStaffAttendance, isInitialized };
}
