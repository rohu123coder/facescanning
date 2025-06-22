'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff, type AttendanceRecord } from '@/lib/data';
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
  
  const addStaff = useCallback((newStaff: Omit<Staff, 'id' | 'attendanceRecords'>) => {
    const newIdNumber = staffList.length > 0 ? Math.max(0, ...staffList.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `KM-${String(newIdNumber).padStart(3, '0')}`;
    const staffToAdd: Staff = { ...newStaff, id: newId, attendanceRecords: [] };
    
    updateStaffList([...staffList, staffToAdd]);
  }, [staffList, updateStaffList]);
  
  const updateStaff = useCallback((updatedStaffData: Staff) => {
    const updatedList = staffList.map(staff => 
      staff.id === updatedStaffData.id ? updatedStaffData : staff
    );
    updateStaffList(updatedList);
  }, [staffList, updateStaffList]);

  const deleteStaff = useCallback((staffId: string) => {
      const updatedList = staffList.filter(staff => staff.id !== staffId);
      updateStaffList(updatedList);
  }, [staffList, updateStaffList]);
  
  const updateStaffAttendance = useCallback((staffId: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const updatedList = staffList.map(staff => {
      if (staff.id !== staffId) {
        return staff;
      }

      const records = staff.attendanceRecords ? [...staff.attendanceRecords] : [];
      const todayRecordIndex = records.findIndex(r => r.date === today);

      // This is the first punch of the day, create a new record.
      if (todayRecordIndex === -1) {
        const newRecord: AttendanceRecord = { date: today, inTime: currentTime, outTime: null, totalHours: null };
        return { ...staff, attendanceRecords: [...records, newRecord] };
      }

      // A record for today exists. Update it without mutation.
      const updatedRecords = [...records];
      const existingRecord = updatedRecords[todayRecordIndex];
      
      let updatedRecord: AttendanceRecord;

      // This logic ensures if an in-time exists, we're setting/updating the out-time.
      // If for some reason a record for today exists but without an in-time, this will set it.
      if (!existingRecord.inTime) {
        updatedRecord = { ...existingRecord, inTime: currentTime };
      } else {
        const inTimeDate = parseTime(today, existingRecord.inTime);
        const outTimeDate = parseTime(today, currentTime);
        const totalHours = (!isNaN(inTimeDate.getTime()) && !isNaN(outTimeDate.getTime()))
          ? formatDistanceStrict(outTimeDate, inTimeDate)
          : null;
        
        updatedRecord = { ...existingRecord, outTime: currentTime, totalHours };
      }
      
      updatedRecords[todayRecordIndex] = updatedRecord;

      return { ...staff, attendanceRecords: updatedRecords };
    });
    
    updateStaffList(updatedList);
    // Return the status message
    const updatedStaff = updatedList.find(s => s.id === staffId);
    const updatedRecordForStatus = updatedStaff?.attendanceRecords?.find(r => r.date === today);
    if (updatedRecordForStatus?.outTime) {
        return 'Clocked Out';
    }
    return 'Clocked In';

  }, [staffList, updateStaffList]);


  return { staffList, setStaffList, addStaff, updateStaff, deleteStaff, updateStaffAttendance, isInitialized };
}
