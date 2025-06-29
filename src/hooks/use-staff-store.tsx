
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

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

  // Load from localStorage on mount
  useEffect(() => {
    if (storeKey) {
      try {
        const storedStaff = localStorage.getItem(storeKey);
        setStaff(storedStaff ? JSON.parse(storedStaff) : []);
      } catch (error) {
        console.error("Failed to load staff from localStorage", error);
        setStaff([]);
      }
    } else {
        setStaff([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (storeKey && isInitialized) {
        try {
            localStorage.setItem(storeKey, JSON.stringify(staff));
        } catch (error) {
            console.error("Failed to save staff to localStorage. Quota may be exceeded.", error);
        }
    }
  }, [staff, storeKey, isInitialized]);

  const addStaff = useCallback((newStaffData: Omit<Staff, 'id'>) => {
    setStaff((prevStaff) => {
        const newIdNumber = prevStaff.length > 0 ? Math.max(0, ...prevStaff.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
        const newId = `S-${String(newIdNumber).padStart(3, '0')}`;
        const staffToAdd: Staff = { ...newStaffData, id: newId };
        return [...prevStaff, staffToAdd];
    });
  }, []);

  const updateStaff = useCallback((updatedStaffData: Staff) => {
    setStaff((prevStaff) => {
        return prevStaff.map(member =>
          member.id === updatedStaffData.id ? updatedStaffData : member
        );
    });
  }, []);
  
  const deleteStaff = useCallback((staffId: string) => {
    setStaff((prevStaff) => {
        return prevStaff.filter(member => member.id !== staffId);
    });
  }, []);

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
