
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type LeaveRequest } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';
import { useStaffStore } from './use-staff-store.tsx';
import { differenceInDays, parseISO } from 'date-fns';

const getStoreKey = (clientId: string | undefined) => clientId ? `leaveRequests_${clientId}` : null;

interface LeaveContextType {
  requests: LeaveRequest[];
  addRequest: (newRequestData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => void;
  approveRequest: (requestId: string) => Promise<{success: boolean; message?: string}>;
  rejectRequest: (requestId: string) => Promise<void>;
  isInitialized: boolean;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export function LeaveProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const { staff, updateStaff } = useStaffStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        setRequests(storedData ? JSON.parse(storedData) : []);
      } catch (error) {
        console.error("Failed to load leave requests from localStorage", error);
        setRequests([]);
      }
    } else {
      setRequests([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
    if(storeKey && isInitialized) {
        localStorage.setItem(storeKey, JSON.stringify(requests));
    }
  }, [requests, storeKey, isInitialized]);

  const addRequest = useCallback((newRequestData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => {
    setRequests(prevRequests => {
      const newRequest: LeaveRequest = {
        ...newRequestData,
        id: `L-${Date.now()}`,
        status: 'Pending',
        requestDate: new Date().toISOString(),
      };
      
      const staffMember = staff.find(s => s.id === newRequest.staffId);
      if (staffMember) {
          window.dispatchEvent(new CustomEvent('new-leave-request', { 
            detail: { staffName: staffMember.name, leaveType: newRequest.leaveType } 
          }));
      }

      return [...prevRequests, newRequest];
    });
  }, [staff]);

  const approveRequest = useCallback(async (requestId: string): Promise<{success: boolean; message?: string}> => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Leave request not found.' };

    const staffMember = staff.find(s => s.id === req.staffId);
    if (!staffMember) return { success: false, message: 'Staff member not found.' };

    const leaveStart = parseISO(req.startDate);
    const leaveEnd = parseISO(req.endDate);
    const leaveDays = differenceInDays(leaveEnd, leaveStart) + 1;

    let updatedStaffMember = { ...staffMember };

    if (req.leaveType === 'Casual') {
        if (updatedStaffMember.annualCasualLeaves < leaveDays) {
            return { success: false, message: 'Not enough casual leave balance.' };
        }
        updatedStaffMember.annualCasualLeaves -= leaveDays;
    } else if (req.leaveType === 'Sick') {
        if (updatedStaffMember.annualSickLeaves < leaveDays) {
            return { success: false, message: 'Not enough sick leave balance.' };
        }
        updatedStaffMember.annualSickLeaves -= leaveDays;
    }
    
    updateStaff(updatedStaffMember);
    setRequests(prevRequests => prevRequests.map(r => 
        r.id === requestId ? { ...r, status: 'Approved' as const } : r
    ));

    return { success: true };
  }, [requests, staff, updateStaff]);


  const rejectRequest = useCallback(async (requestId: string): Promise<void> => {
    setRequests(prevRequests => {
      return prevRequests.map(r =>
        r.id === requestId ? { ...r, status: 'Rejected' as const } : r
      );
    });
  }, []);
  
  return (
    <LeaveContext.Provider value={{ requests, addRequest, approveRequest, rejectRequest, isInitialized }}>
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeaveStore() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeaveStore must be used within a LeaveProvider');
  }
  return context;
}
