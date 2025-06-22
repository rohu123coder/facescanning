'use client';

import { useState, useEffect, useCallback } from 'react';
import { type LeaveRequest, initialLeaveRequests } from '@/lib/data';
import { useToast } from './use-toast';
import { addDays, differenceInCalendarDays, format, getDay, isWithinInterval, parseISO } from 'date-fns';

const STORE_KEY = 'leaveRequests';

// Helper function to count business days between two dates, excluding weekends and holidays
export const countLeaveDays = (startDate: Date, endDate: Date, weeklyOffDays: number[], holidays: string[]): number => {
    let count = 0;
    const holidaySet = new Set(holidays);
    let currentDate = startDate;

    while (currentDate <= endDate) {
        const dayOfWeek = getDay(currentDate);
        const isoDate = format(currentDate, 'yyyy-MM-dd');
        
        if (!weeklyOffDays.includes(dayOfWeek) && !holidaySet.has(isoDate)) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }
    return count;
};


export function useLeaveStore() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedRequests = localStorage.getItem(STORE_KEY);
      if (storedRequests) {
        setLeaveRequests(JSON.parse(storedRequests));
      } else {
        setLeaveRequests(initialLeaveRequests);
        localStorage.setItem(STORE_KEY, JSON.stringify(initialLeaveRequests));
      }
    } catch (error) {
      console.error("Failed to load leave requests from localStorage", error);
      setLeaveRequests(initialLeaveRequests);
    }
    setIsInitialized(true);
  }, []);

  const updateLeaveRequestList = useCallback((newList: LeaveRequest[]) => {
    const sortedList = newList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLeaveRequests(sortedList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save leave requests to localStorage", error);
    }
  }, []);

  const addLeaveRequest = useCallback((newRequest: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newIdNumber = leaveRequests.length > 0 ? Math.max(0, ...leaveRequests.map(t => parseInt(t.id.split('-')[1], 10))) + 1 : 1;
    const newId = `LR-${String(newIdNumber).padStart(4, '0')}`;
    const requestToAdd: LeaveRequest = { 
        ...newRequest, 
        id: newId, 
        createdAt: new Date().toISOString(),
        status: 'Pending',
    };
    
    updateLeaveRequestList([requestToAdd, ...leaveRequests]);
    toast({
        title: 'Leave Request Submitted',
        description: `Your request for ${newRequest.leaveType} leave has been submitted.`,
    });
  }, [leaveRequests, updateLeaveRequestList, toast]);
  
  const updateLeaveRequestStatus = useCallback((requestId: string, newStatus: 'Approved' | 'Rejected') => {
    const request = leaveRequests.find(r => r.id === requestId);
    if (request) {
      const updatedList = leaveRequests.map(r => r.id === requestId ? { ...r, status: newStatus } : r);
      updateLeaveRequestList(updatedList);
      toast({
        title: 'Request Updated',
        description: `Leave request has been ${newStatus.toLowerCase()}.`,
      });
    }
  }, [leaveRequests, updateLeaveRequestList, toast]);

  const getApprovedLeavesForEmployee = useCallback((employeeId: string, monthStart: Date, monthEnd: Date, weeklyOffDays: number[], holidays: string[]) => {
      const approvedLeaves = {
          casual: 0,
          sick: 0,
          total: 0,
      };

      leaveRequests
          .filter(req => req.employeeId === employeeId && req.status === 'Approved')
          .forEach(req => {
              const reqStart = parseISO(req.startDate);
              const reqEnd = parseISO(req.endDate);
              
              const intervalStart = monthStart > reqStart ? monthStart : reqStart;
              const intervalEnd = monthEnd < reqEnd ? monthEnd : reqEnd;

              if (intervalStart <= intervalEnd) {
                  const daysInMonth = countLeaveDays(intervalStart, intervalEnd, weeklyOffDays, holidays);
                  if(req.leaveType === 'Casual') {
                      approvedLeaves.casual += daysInMonth;
                  } else {
                      approvedLeaves.sick += daysInMonth;
                  }
                  approvedLeaves.total += daysInMonth;
              }
          });
          
      return approvedLeaves;
  }, [leaveRequests]);

  return { leaveRequests, addLeaveRequest, updateLeaveRequestStatus, getApprovedLeavesForEmployee, isInitialized };
}
