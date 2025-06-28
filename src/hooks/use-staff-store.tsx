
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `staffList_${clientId}` : null;
const getPhotoKey = (staffId: string) => `photo_${staffId}`;

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
        // If no data, start with an empty array for a fresh start.
        let loadedStaff = storedStaff ? JSON.parse(storedStaff) : [];
        
        // Re-hydrate photo URLs from separate storage
        loadedStaff = loadedStaff.map((staffMember: Staff) => {
            const photoData = localStorage.getItem(getPhotoKey(staffMember.id));
            if (photoData) {
                return { ...staffMember, photoUrl: photoData };
            }
            return staffMember;
        });

        setStaff(loadedStaff);

      } catch (error) {
        console.error("Failed to load staff from localStorage", error);
        setStaff([]);
      }
    } else {
        setStaff([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  // Save to localStorage on change, separating photo data
  useEffect(() => {
    if (storeKey && isInitialized) {
        try {
            const staffToStore = staff.map(staffMember => {
                const { photoUrl, ...rest } = staffMember;
                if (photoUrl && photoUrl.startsWith('data:image')) {
                    // Store large photo data separately
                    localStorage.setItem(getPhotoKey(staffMember.id), photoUrl);
                    // Return staff object without photo data for main list
                    return { ...rest, photoUrl: '' };
                }
                return { ...rest, photoUrl: photoUrl || '' }; // Ensure photoUrl is not undefined
            });
            localStorage.setItem(storeKey, JSON.stringify(staffToStore));
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
    // Also remove the photo from localStorage
    localStorage.removeItem(getPhotoKey(staffId));
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
