'use client';

import { useState, useEffect, useCallback } from 'react';

const STORE_KEY = 'salaryRules';

export type SalaryRules = {
  basicPercentage: number;
  hraPercentage: number;
  deductionPercentage: number;
};

const defaultRules: SalaryRules = {
  basicPercentage: 50,
  hraPercentage: 30,
  deductionPercentage: 10,
};

export function useSalaryRulesStore() {
  const [rules, setRules] = useState<SalaryRules>(defaultRules);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedRules = localStorage.getItem(STORE_KEY);
      if (storedRules) {
        setRules(JSON.parse(storedRules));
      } else {
        localStorage.setItem(STORE_KEY, JSON.stringify(defaultRules));
      }
    } catch (error) {
      console.error("Failed to load salary rules from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  const updateRules = useCallback((newRules: SalaryRules) => {
    setRules(newRules);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(newRules));
    } catch (error) {
      console.error("Failed to save salary rules to localStorage", error);
    }
  }, []);
  
  return { rules, updateRules, isInitialized };
}
