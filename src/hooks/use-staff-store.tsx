
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff, initialStaff } from '@/lib/data';
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
        let staffData = storedStaff ? JSON.parse(storedStaff) : initialStaff; // Use initialStaff as default
        
        // --- MIGRATION LOGIC START ---
        // One-time migration to convert old string IDs (e.g., "S-001") to numeric strings.
        let needsUpdate = false;
        let lastNumericId = 5000;
        
        const numericStaffIds = staffData
            .map((s: Staff) => parseInt(s.id, 10))
            .filter((id: number) => !isNaN(id));
            
        if (numericStaffIds.length > 0) {
            lastNumericId = Math.max(...numericStaffIds);
        }

        staffData = staffData.map((staffMember: Staff) => {
            if (isNaN(parseInt(staffMember.id, 10))) {
                needsUpdate = true;
                lastNumericId++;
                return { ...staffMember, id: String(lastNumericId) };
            }
            return staffMember;
        });

        if (needsUpdate || !storedStaff) { // Also save if it was the first time
            localStorage.setItem(storeKey, JSON.stringify(staffData));
        }
        // --- MIGRATION LOGIC END ---

        setStaff(staffData);

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
        const numericStaffIds = prevStaff.map(s => parseInt(s.id, 10)).filter(id => !isNaN(id));
        const highestId = numericStaffIds.length > 0 ? Math.max(...numericStaffIds) : 5000;
        const newId = String(highestId + 1);

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
