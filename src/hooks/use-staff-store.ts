'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff, initialStaff } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `staffList_${clientId}` : null;

export function useStaffStore() {
  const { currentClient } = useClientStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const storeKey = getStoreKey(currentClient?.id);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedStaff = localStorage.getItem(storeKey);
        if (storedStaff) {
          setStaff(JSON.parse(storedStaff));
        } else {
          setStaff(initialStaff);
          localStorage.setItem(storeKey, JSON.stringify(initialStaff));
        }
      } catch (error) {
        console.error("Failed to load staff from localStorage", error);
        setStaff(initialStaff);
      }
    } else {
        setStaff([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const updateStaffList = useCallback((newList: Staff[]) => {
    if (storeKey) {
        setStaff(newList);
        try {
            localStorage.setItem(storeKey, JSON.stringify(newList));
        } catch (error) {
            console.error("Failed to save staff to localStorage", error);
        }
    }
  }, [storeKey]);

  const addStaff = useCallback((newStaffData: Omit<Staff, 'id'>) => {
    const newIdNumber = staff.length > 0 ? Math.max(0, ...staff.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `S-${String(newIdNumber).padStart(3, '0')}`;
    const staffToAdd: Staff = { ...newStaffData, id: newId };
    updateStaffList([...staff, staffToAdd]);
  }, [staff, updateStaffList]);

  const updateStaff = useCallback((updatedStaffData: Staff) => {
    const updatedList = staff.map(member =>
      member.id === updatedStaffData.id ? updatedStaffData : member
    );
    updateStaffList(updatedList);
  }, [staff, updateStaffList]);
  
  const deleteStaff = useCallback((staffId: string) => {
    const updatedList = staff.filter(member => member.id !== staffId);
    updateStaffList(updatedList);
  }, [staff, updateStaffList]);

  return { staff, addStaff, updateStaff, deleteStaff, isInitialized };
}
