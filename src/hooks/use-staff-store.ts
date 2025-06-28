
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff, initialStaff } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `staffList_${clientId}` : null;

interface StaffContextType {
  staff: Staff[];
  addStaff: (newStaffData: Omit<Staff, 'id'>) => void;
  updateStaff: (updatedStaffData: Staff) => void;
  deleteStaff: (staffId: string) => void;
  isInitialized: boolean;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const storeKey = getStoreKey(currentClient?.id);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedStaff = localStorage.getItem(storeKey);
        setStaff(storedStaff ? JSON.parse(storedStaff) : initialStaff);
      } catch (error) {
        console.error("Failed to load staff from localStorage", error);
        setStaff(initialStaff);
      }
    } else {
        setStaff([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  const addStaff = useCallback((newStaffData: Omit<Staff, 'id'>) => {
    setStaff((prevStaff) => {
        const newIdNumber = prevStaff.length > 0 ? Math.max(0, ...prevStaff.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
        const newId = `S-${String(newIdNumber).padStart(3, '0')}`;
        const staffToAdd: Staff = { ...newStaffData, id: newId };
        const newList = [...prevStaff, staffToAdd];
        if(storeKey) localStorage.setItem(storeKey, JSON.stringify(newList));
        return newList;
    });
  }, [storeKey]);

  const updateStaff = useCallback((updatedStaffData: Staff) => {
    setStaff((prevStaff) => {
        const updatedList = prevStaff.map(member =>
          member.id === updatedStaffData.id ? updatedStaffData : member
        );
        if(storeKey) localStorage.setItem(storeKey, JSON.stringify(updatedList));
        return updatedList;
    });
  }, [storeKey]);
  
  const deleteStaff = useCallback((staffId: string) => {
    setStaff((prevStaff) => {
        const updatedList = prevStaff.filter(member => member.id !== staffId);
        if(storeKey) localStorage.setItem(storeKey, JSON.stringify(updatedList));
        return updatedList;
    });
  }, [storeKey]);

  return (
    <StaffContext.Provider value={{ staff, addStaff, updateStaff, deleteStaff, isInitialized }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaffStore() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaffStore must be used within a StaffProvider');
  }
  return context;
}
