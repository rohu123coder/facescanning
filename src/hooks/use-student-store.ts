'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Student, type AttendanceRecord } from '@/lib/data';
import { parse, formatDistanceStrict } from 'date-fns';

const STORE_KEY = 'studentList';

// Helper to parse time strings like "09:05:30 AM"
const parseTime = (dateStr: string, timeStr: string): Date => {
  return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd h:mm:ss a', new Date());
};

export function useStudentStore() {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem(STORE_KEY);
      if (storedStudents) {
        setStudentList(JSON.parse(storedStudents));
      }
    } catch (error) {
      console.error("Failed to load students from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  const updateStudentList = useCallback((newList: Student[]) => {
    setStudentList(newList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(newList));
    } catch (error) {
      console.error("Failed to save students to localStorage", error);
    }
  }, []);
  
  const addStudent = useCallback((newStudent: Omit<Student, 'id' | 'attendanceRecords'>) => {
    const newIdNumber = studentList.length > 0 ? Math.max(0, ...studentList.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `ST-${String(newIdNumber).padStart(4, '0')}`;
    const studentToAdd: Student = { ...newStudent, id: newId, attendanceRecords: [] };
    
    updateStudentList([...studentList, studentToAdd]);
  }, [studentList, updateStudentList]);

  const updateStudent = useCallback((updatedStudentData: Student) => {
    const updatedList = studentList.map(student => 
      student.id === updatedStudentData.id ? updatedStudentData : student
    );
    updateStudentList(updatedList);
  }, [studentList, updateStudentList]);

  const deleteStudent = useCallback((studentId: string) => {
      const updatedList = studentList.filter(student => student.id !== studentId);
      updateStudentList(updatedList);
  }, [studentList, updateStudentList]);
  
  const updateStudentAttendance = useCallback((studentId: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const updatedList = studentList.map(student => {
      if (student.id === studentId) {
        const records = student.attendanceRecords ? [...student.attendanceRecords] : [];
        let todayRecord = records.find(r => r.date === today);

        if (todayRecord) {
          if (!todayRecord.inTime) {
             // This case should not happen if logic is correct, but as a fallback
            todayRecord.inTime = currentTime;
          } else {
            todayRecord.outTime = currentTime;
            const inTimeDate = parseTime(today, todayRecord.inTime);
            const outTimeDate = parseTime(today, currentTime);
            if (!isNaN(inTimeDate.getTime()) && !isNaN(outTimeDate.getTime())) {
              todayRecord.totalHours = formatDistanceStrict(outTimeDate, inTimeDate);
            }
          }
        } else {
          todayRecord = { date: today, inTime: currentTime, outTime: null, totalHours: null };
          records.push(todayRecord);
        }
        return { ...student, attendanceRecords: records };
      }
      return student;
    });
    
    updateStudentList(updatedList);
    const updatedStudent = updatedList.find(s => s.id === studentId);
    const updatedRecord = updatedStudent?.attendanceRecords?.find(r => r.date === today);

    if (updatedRecord?.outTime) {
        return 'Departed';
    }
    return 'Arrived';
  }, [studentList, updateStudentList]);

  return { studentList, setStudentList, addStudent, updateStudent, deleteStudent, updateStudentAttendance, isInitialized };
}
