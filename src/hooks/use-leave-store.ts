'use client';

import { useState, useEffect, useCallback } from 'react';
import { type LeaveRequest, initialLeaves } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `leaveRequests_${clientId}` : null;

export function useLeaveStore() {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedLeaves = localStorage.getItem(storeKey);
        if (storedLeaves) {
          setLeaves(JSON.parse(storedLeaves));
        } else {
          setLeaves(initialLeaves); // Load initial data if none exists
          localStorage.setItem(storeKey, JSON.stringify(initialLeaves));
        }
      } catch (error) {
        console.error("Failed to load leaves from localStorage", error);
        setLeaves(initialLeaves);
      }
    } else {
      setLeaves([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const updateLeaveList = useCallback((newList: LeaveRequest[]) => {
    if (storeKey) {
      setLeaves(newList);
      try {
        localStorage.setItem(storeKey, JSON.stringify(newList));
      } catch (error) {
        console.error("Failed to save leaves to localStorage", error);
      }
    }
  }, [storeKey]);

  const addLeaveRequest = useCallback((newLeaveData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => {
    const newId = `L-${Date.now()}`;
    const leaveToAdd: LeaveRequest = {
      ...newLeaveData,
      id: newId,
      status: 'Pending',
      requestDate: new Date().toISOString(),
    };
    updateLeaveList([...leaves, leaveToAdd]);
  }, [leaves, updateLeaveList]);

  const approveLeave = useCallback((leaveId: string) => {
    const updatedList = leaves.map(leave =>
      leave.id === leaveId ? { ...leave, status: 'Approved' as const } : leave
    );
    updateLeaveList(updatedList);
  }, [leaves, updateLeaveList]);

  const rejectLeave = useCallback((leaveId: string) => {
    const updatedList = leaves.map(leave =>
      leave.id === leaveId ? { ...leave, status: 'Rejected' as const } : leave
    );
    updateLeaveList(updatedList);
  }, [leaves, updateLeaveList]);

  return { leaves, addLeaveRequest, approveLeave, rejectLeave, isInitialized };
}
