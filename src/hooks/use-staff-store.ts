'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff } from '@/lib/data';
import { parse, differenceInMinutes, formatDistanceStrict } from 'date-fns';

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
      }
    } catch (error) {
      console.error("Failed to load staff from localStorage", error);
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
  
  const addStaff = useCallback((newStaff: Omit<Staff, 'id' | 'attendanceStatus'>) => {
    const newIdNumber = staffList.length > 0 ? Math.max(0, ...staffList.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `KM-${String(newIdNumber).padStart(3, '0')}`;
    const staffToAdd: Staff = { ...newStaff, id: newId, attendanceStatus: null };
    
    updateStaffList([...staffList, staffToAdd]);
  }, [staffList, updateStaffList]);
  
  const updateStaffAttendance = useCallback((staffId: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const updatedList = staffList.map(staff => {
      if (staff.id === staffId) {
        const attendance = staff.attendanceStatus && staff.attendanceStatus.date === today
          ? { ...staff.attendanceStatus }
          : { date: today, inTime: null, outTime: null, totalHours: null };

        if (!attendance.inTime) {
          attendance.inTime = currentTime;
        } else {
          attendance.outTime = currentTime;
          const inTimeDate = parseTime(today, attendance.inTime);
          const outTimeDate = parseTime(today, attendance.outTime);
          
          if (!isNaN(inTimeDate.getTime()) && !isNaN(outTimeDate.getTime())) {
            attendance.totalHours = formatDistanceStrict(outTimeDate, inTimeDate);
          }
        }
        return { ...staff, attendanceStatus: attendance };
      }
      return staff;
    });
    
    updateStaffList(updatedList);
    // Return the status message
    const updatedStaff = updatedList.find(s => s.id === staffId);
    if (updatedStaff?.attendanceStatus?.outTime) {
        return 'Clocked Out';
    }
    return 'Clocked In';

  }, [staffList, updateStaffList]);


  return { staffList, setStaffList, addStaff, updateStaffAttendance, isInitialized };
}
