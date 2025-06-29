
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type SalarySlipData } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

const getStoreKey = (clientId: string | undefined) => clientId ? `salarySlips_${clientId}` : null;

interface SalarySlipsContextType {
  slips: SalarySlipData[];
  addOrUpdateSlips: (newSlips: SalarySlipData[]) => void;
  isInitialized: boolean;
}

const SalarySlipsContext = createContext<SalarySlipsContextType | undefined>(undefined);

export function SalarySlipsProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [slips, setSlips] = useState<SalarySlipData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedSlips = localStorage.getItem(storeKey);
        setSlips(storedSlips ? JSON.parse(storedSlips) : []);
      } catch (error) {
        console.error("Failed to load salary slips from localStorage", error);
        setSlips([]);
      }
    } else {
        setSlips([]);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
    if (storeKey && isInitialized) {
        localStorage.setItem(storeKey, JSON.stringify(slips));
    }
  }, [slips, storeKey, isInitialized]);

  const addOrUpdateSlips = useCallback((newSlips: SalarySlipData[]) => {
    if (newSlips.length === 0) return;

    const { month, year } = newSlips[0]; 

    setSlips(prevSlips => {
      const otherSlips = prevSlips.filter(s => !(s.month === month && s.year === year));
      const newList = [...otherSlips, ...newSlips];
      return newList.sort((a,b) => new Date(`${b.month} 1, ${b.year}`).getTime() - new Date(`${a.month} 1, ${a.year}`).getTime());
    });
  }, []);

  return (
    <SalarySlipsContext.Provider value={{ slips, addOrUpdateSlips, isInitialized }}>
      {children}
    </SalarySlipsContext.Provider>
  );
}

export function useSalarySlipsStore() {
  const context = useContext(SalarySlipsContext);
  if (context === undefined) {
    throw new Error('useSalarySlipsStore must be used within a SalarySlipsProvider');
  }
  return context;
}
