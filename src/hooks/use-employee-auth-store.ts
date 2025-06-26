'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Staff } from '@/lib/data';

const AUTH_KEY = 'loggedInEmployeeId';
const STAFF_STORE_KEY = 'staffList';

export function useEmployeeAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Staff | null>(null);
  
  const getStaffList = (): Staff[] => {
      try {
        const storedStaff = localStorage.getItem(STAFF_STORE_KEY);
        return storedStaff ? JSON.parse(storedStaff) : [];
      } catch (error) {
          console.error("Failed to load staff from localStorage", error);
          return [];
      }
  }

  useEffect(() => {
    try {
      const loggedInEmployeeId = localStorage.getItem(AUTH_KEY);
      if (loggedInEmployeeId) {
        const allStaff = getStaffList();
        const employee = allStaff.find(s => s.id === loggedInEmployeeId);
        if (employee) {
          setIsAuthenticated(true);
          setCurrentEmployee(employee);
        } else {
            // Clean up if the employee ID is invalid
            localStorage.removeItem(AUTH_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to check auth status", error);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; }> => {
    try {
        const allStaff = getStaffList();
        const employee = allStaff.find(s => s.email === email);

        // For this simulation, the password is the staff member's mobile number
        if (employee && employee.mobile === password) {
          localStorage.setItem(AUTH_KEY, employee.id);
          setIsAuthenticated(true);
          setCurrentEmployee(employee);
          return { success: true };
        }
        
        return { success: false, message: "Invalid email or password." };

    } catch (error) {
        console.error("Failed to login", error);
        return { success: false, message: "An error occurred during login." };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
      setCurrentEmployee(null);
      window.location.assign('/employee-login');
    } catch (error) {
        console.error("Failed to logout", error);
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, currentEmployee, login, logout };
}
