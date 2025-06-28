
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type LeaveRequest } from '@/lib/data';
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
        // If no data, start with an empty array for a fresh start.
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
      const newList = [...prevRequests, newRequest];
      return newList;
    });
  }, []);

  const approveRequest = useCallback((requestId: string) => {
    setRequests(prevRequests => {
        const req = prevRequests.find(r => r.id === requestId);
        if (!req) return prevRequests;

        const staffMember = staff.find(s => s.id === req.staffId);
        if (!staffMember) return prevRequests;
        
        const leaveDays = 1; // Simplified for now
        let canApprove = false;
        let updatedStaffMember = { ...staffMember };

        if (req.leaveType === 'Casual' && updatedStaffMember.annualCasualLeaves >= leaveDays) {
            updatedStaffMember.annualCasualLeaves -= leaveDays;
            canApprove = true;
        } else if (req.leaveType === 'Sick' && updatedStaffMember.annualSickLeaves >= leaveDays) {
            updatedStaffMember.annualSickLeaves -= leaveDays;
            canApprove = true;
        }

        if(canApprove) {
            updateStaff(updatedStaffMember);
            return prevRequests.map(r => 
                r.id === requestId ? { ...r, status: 'Approved' as const } : r
            );
        }
        return prevRequests;
    });
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
