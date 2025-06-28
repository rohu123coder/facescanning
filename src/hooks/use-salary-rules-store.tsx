
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type SalaryRules } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `salaryRules_${clientId}` : null;

const defaultRules: SalaryRules = {
  offDays: ['0', '6'], // Sunday, Saturday
  basic: 40,
  hra: 20,
  standardDeduction: 5,
};

interface SalaryRulesContextType {
  rules: SalaryRules;
  setRules: (newRules: SalaryRules) => void;
  isInitialized: boolean;
}

const SalaryRulesContext = createContext<SalaryRulesContextType | undefined>(undefined);

export function SalaryRulesProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [rules, setRulesState] = useState<SalaryRules>(defaultRules);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedRules = localStorage.getItem(storeKey);
        setRulesState(storedRules ? JSON.parse(storedRules) : defaultRules);
      } catch (error) {
        console.error("Failed to load salary rules from localStorage", error);
        setRulesState(defaultRules);
      }
    } else {
      setRulesState(defaultRules);
    }
    setIsInitialized(true);
  }, [storeKey]);

  useEffect(() => {
      if (storeKey && isInitialized) {
        localStorage.setItem(storeKey, JSON.stringify(rules));
      }
  }, [rules, storeKey, isInitialized]);

  const setRules = useCallback((newRules: SalaryRules) => {
    setRulesState(newRules);
  }, []);

  return (
    <SalaryRulesContext.Provider value={{ rules, setRules, isInitialized }}>
      {children}
    </SalaryRulesContext.Provider>
  );
}

export function useSalaryRulesStore() {
  const context = useContext(SalaryRulesContext);
  if (context === undefined) {
    throw new Error('useSalaryRulesStore must be used within a SalaryRulesProvider');
  }
  return context;
}
