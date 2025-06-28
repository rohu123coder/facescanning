
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type LeaveRequest, initialLeaves } from '@/lib/data';
import { useClientStore } from './use-client-store';
import { useStaffStore } from './use-staff-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `leaveRequests_${clientId}` : null;

export function useLeaveStore() {
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

  const updateRequestList = useCallback((newList: LeaveRequest[]) => {
    if (storeKey) {
      setRequests(newList);
      try {
        localStorage.setItem(storeKey, JSON.stringify(newList));
      } catch (error) {
        console.error("Failed to save leave requests to localStorage", error);
      }
    }
  }, [storeKey]);

  const addRequest = useCallback((newRequestData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => {
    const newRequest: LeaveRequest = {
      ...newRequestData,
      id: `L-${Date.now()}`,
      status: 'Pending',
      requestDate: new Date().toISOString(),
    };
    updateRequestList([...requests, newRequest]);
  }, [requests, updateRequestList]);

  const approveRequest = useCallback((requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const staffMember = staff.find(s => s.id === request.staffId);
    if (!staffMember) return;
    
    // This is a simplified leave deduction. A real app would handle date ranges better.
    const leaveDays = 1; 

    let canApprove = false;
    if (request.leaveType === 'Casual' && staffMember.annualCasualLeaves > 0) {
        staffMember.annualCasualLeaves -= leaveDays;
        canApprove = true;
    } else if (request.leaveType === 'Sick' && staffMember.annualSickLeaves > 0) {
        staffMember.annualSickLeaves -= leaveDays;
        canApprove = true;
    }

    if(canApprove) {
        updateStaff(staffMember);
        const updatedRequests = requests.map(r => 
          r.id === requestId ? { ...r, status: 'Approved' as const } : r
        );
        updateRequestList(updatedRequests);
    }

  }, [requests, staff, updateRequestList, updateStaff]);

  const rejectRequest = useCallback((requestId: string) => {
    const updatedRequests = requests.map(r =>
      r.id === requestId ? { ...r, status: 'Rejected' as const } : r
    );
    updateRequestList(updatedRequests);
  }, [requests, updateRequestList]);

  return { requests, addRequest, approveRequest, rejectRequest, isInitialized };
}
