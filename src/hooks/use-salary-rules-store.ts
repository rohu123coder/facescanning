'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientStore } from './use-client-store';

export type SalaryRules = {
  workingDays: string[]; // Array of day indices ('0' for Sun, '1' for Mon, etc.)
};

const getStoreKey = (clientId: string | undefined) => clientId ? `salaryRules_${clientId}` : null;

// Default rules: Monday to Friday working
const defaultRules: SalaryRules = {
  workingDays: ['1', '2', '3', '4', '5'],
};

export function useSalaryRulesStore() {
  const { currentClient } = useClientStore();
  const storeKey = getStoreKey(currentClient?.id);
  const [rules, setRulesState] = useState<SalaryRules>(defaultRules);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (storeKey) {
      try {
        const storedData = localStorage.getItem(storeKey);
        if (storedData) {
          setRulesState(JSON.parse(storedData));
        } else {
          setRulesState(defaultRules);
          localStorage.setItem(storeKey, JSON.stringify(defaultRules));
        }
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
