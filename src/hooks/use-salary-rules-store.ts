
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type SalaryRules } from '@/lib/data';
import { useClientStore } from './use-client-store';

const getStoreKey = (clientId: string | undefined) => clientId ? `salaryRules_${clientId}` : null;

const defaultRules: SalaryRules = {
  offDays: ['0', '6'], // Sunday, Saturday
  basic: 40,
  hra: 20,
  standardDeduction: 5,
};

export function useSalaryRulesStore() {
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

  const setRules = useCallback((newRules: SalaryRules) => {
    if (storeKey) {
      setRulesState(newRules);
      try {
        localStorage.setItem(storeKey, JSON.stringify(newRules));
      } catch (error) {
        console.error("Failed to save salary rules to localStorage", error);
      }
    }
  }, [storeKey]);

  return { rules, setRules, isInitialized };
}
