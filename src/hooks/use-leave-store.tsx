
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type LeaveRequest, initialLeaves } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';
import { useStaffStore } from './use-staff-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `leaveRequests_${clientId}` : null;

interface LeaveContextType {
  requests: LeaveRequest[];
  addRequest: (newRequestData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
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
        setRequests(storedData ? JSON.parse(storedData) : initialLeaves);
      } catch (error) {
        console.error("Failed to load leave requests from localStorage", error);
        setRequests(initialLeaves);
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
      const newList = [...prevRequests, newRequest];
      return newList;
    });
  }, []);

  const approveRequest = useCallback((requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const staffMember = staff.find(s => s.id === request.staffId);
    if (!staffMember) return;
    
    const leaveDays = 1; 
    let canApprove = false;
    let updatedStaffMember = { ...staffMember };

    if (request.leaveType === 'Casual' && updatedStaffMember.annualCasualLeaves >= leaveDays) {
        updatedStaffMember.annualCasualLeaves -= leaveDays;
        canApprove = true;
    } else if (request.leaveType === 'Sick' && updatedStaffMember.annualSickLeaves >= leaveDays) {
        updatedStaffMember.annualSickLeaves -= leaveDays;
        canApprove = true;
    }

    if(canApprove) {
        updateStaff(updatedStaffMember);
        setRequests(prevRequests => {
          const updatedRequests = prevRequests.map(r => 
            r.id === requestId ? { ...r, status: 'Approved' as const } : r
          );
          return updatedRequests;
        });
    }
  }, [requests, staff, updateStaff]);

  const rejectRequest = useCallback((requestId: string) => {
    setRequests(prevRequests => {
      const updatedRequests = prevRequests.map(r =>
        r.id === requestId ? { ...r, status: 'Rejected' as const } : r
      );
      return updatedRequests;
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
