
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Holiday, initialHolidays } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `holidays_${clientId}` : null;

interface HolidayContextType {
  holidays: Holiday[];
  addHoliday: (newHoliday: Omit<Holiday, 'id'>) => void;
  removeHoliday: (holidayId: string) => void;
  isInitialized: boolean;
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

export function HolidayProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        const data = storedData ? JSON.parse(storedData) : initialHolidays;
        setHolidays(data);
        if (!storedData) {
          localStorage.setItem(storeKey, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to load holidays from localStorage", error);
        setHolidays([]);
      }
    } else {
      setHolidays([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
    if (storeKey && isInitialized) {
      localStorage.setItem(storeKey, JSON.stringify(holidays));
    }
  }, [holidays, storeKey, isInitialized]);

  const addHoliday = useCallback((newHolidayData: Omit<Holiday, 'id'>) => {
    setHolidays(prev => {
      const newHoliday: Holiday = {
        ...newHolidayData,
        id: `H-${Date.now()}`,
      };
      // Prevent adding duplicate dates
      if (prev.some(h => h.date === newHoliday.date)) {
        return prev;
      }
      const newList = [...prev, newHoliday];
      return newList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }, []);

  const removeHoliday = useCallback((holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
  }, []);
  
  return (
    <HolidayContext.Provider value={{ holidays, addHoliday, removeHoliday, isInitialized }}>
      {children}
    </HolidayContext.Provider>
  );
}

export function useHolidayStore() {
  const context = useContext(HolidayContext);
  if (context === undefined) {
    throw new Error('useHolidayStore must be used within a HolidayProvider');
  }
  return context;
}
