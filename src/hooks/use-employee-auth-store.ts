
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Staff, type Client, initialClients } from '@/lib/data';

const EMPLOYEE_AUTH_KEY = 'loggedInEmployeeId';
const CLIENT_FOR_EMPLOYEE_KEY = 'loggedInEmployeeClientId';
const ALL_CLIENTS_KEY = 'clientList';
const STAFF_LIST_KEY_PREFIX = 'staffList_';

interface EmployeeAuthContextType {
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  employee: Staff | null;
  login: (employeeId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthStoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [employee, setEmployee] = useState<Staff | null>(null);

  const loadEmployeeData = useCallback(() => {
    try {
      const employeeId = localStorage.getItem(EMPLOYEE_AUTH_KEY);
      const clientId = localStorage.getItem(CLIENT_FOR_EMPLOYEE_KEY);
      
      if (employeeId && clientId) {
        const staffListJSON = localStorage.getItem(`${STAFF_LIST_KEY_PREFIX}${clientId}`);
        if (staffListJSON) {
          const staffList: Staff[] = JSON.parse(staffListJSON);
          const loggedInEmployee = staffList.find(s => s.id === employeeId);
          if (loggedInEmployee) {
            setEmployee(loggedInEmployee);
            setIsAuthenticated(true);
            return;
          }
        }
      }
      // If anything fails, clear auth state
      localStorage.removeItem(EMPLOYEE_AUTH_KEY);
      localStorage.removeItem(CLIENT_FOR_EMPLOYEE_KEY);
      setEmployee(null);
      setIsAuthenticated(false);

    } catch (error) {
      console.error("Failed to load employee data", error);
      setIsAuthenticated(false);
      setEmployee(null);
    }
  }, []);

  useEffect(() => {
    loadEmployeeData();
    setIsAuthInitialized(true);
  }, [loadEmployeeData]);

  const login = useCallback(async (employeeId: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const allClientsJSON = localStorage.getItem(ALL_CLIENTS_KEY);
      const allClients: Client[] = allClientsJSON ? JSON.parse(allClientsJSON) : initialClients;

      for (const client of allClients) {
        const staffListJSON = localStorage.getItem(`${STAFF_LIST_KEY_PREFIX}${client.id}`);
        if (staffListJSON) {
          const staffList: Staff[] = JSON.parse(staffListJSON);
          const foundEmployee = staffList.find(s => s.id === employeeId && s.password === password);
          
          if (foundEmployee) {
            localStorage.setItem(EMPLOYEE_AUTH_KEY, foundEmployee.id);
            localStorage.setItem(CLIENT_FOR_EMPLOYEE_KEY, client.id);
            // This is key for making other hooks work
            localStorage.setItem('loggedInClientId', client.id);
            
            setEmployee(foundEmployee);
            setIsAuthenticated(true);
            return { success: true };
          }
        }
      }
      return { success: false, message: "Invalid Employee ID or Password." };
    } catch (error) {
      console.error("Employee login failed", error);
      return { success: false, message: "An error occurred during login." };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(EMPLOYEE_AUTH_KEY);
      localStorage.removeItem(CLIENT_FOR_EMPLOYEE_KEY);
      // Also clear the main client ID to avoid conflicts
      localStorage.removeItem('loggedInClientId');
      setIsAuthenticated(false);
      setEmployee(null);
      window.location.assign('/employee-login');
    } catch (error) {
      console.error("Failed to logout employee", error);
    }
  }, []);

  const value = { isAuthenticated, isAuthInitialized, employee, login, logout };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuthStore() {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuthStore must be used within an EmployeeAuthStoreProvider');
  }
  return context;
}
