'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Holiday } from '@/lib/data';

const STORE_KEY = 'holidayList';

export function useHolidayStore() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedHolidays = localStorage.getItem(STORE_KEY);
      if (storedHolidays) {
        setHolidays(JSON.parse(storedHolidays));
      }
    } catch (error) {
      console.error("Failed to load holidays from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  const updateHolidays = useCallback((newList: Holiday[]) => {
    // Sort by date before setting
    const sortedList = newList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setHolidays(sortedList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(sortedList));
    } catch (error) {
      console.error("Failed to save holidays to localStorage", error);
    }
  }, []);

  const addHoliday = useCallback((newHoliday: Holiday) => {
    updateHolidays([...holidays, newHoliday]);
  }, [holidays, updateHolidays]);

  const deleteHoliday = useCallback((holidayDate: string) => {
    const updatedList = holidays.filter(h => h.date !== holidayDate);
    updateHolidays(updatedList);
  }, [holidays, updateHolidays]);

  return { holidays, addHoliday, deleteHoliday, isInitialized };
}
