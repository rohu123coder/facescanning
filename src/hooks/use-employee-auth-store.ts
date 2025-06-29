
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Client, type Staff } from '@/lib/data';

const AUTH_KEY = 'loggedInEmployeeId';
const CLIENT_ID_KEY = 'loggedInClientId'; // This is shared to make providers work
const CLIENT_LIST_KEY = 'clientList';

type LoginResult = {
    success: boolean;
    message?: string;
    staff?: Staff;
}

export function useEmployeeAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loggedInEmployeeId = localStorage.getItem(AUTH_KEY);
      if (loggedInEmployeeId) {
        setIsAuthenticated(true);
        setCurrentEmployeeId(loggedInEmployeeId);
      }
    } catch (error) {
      console.error("Failed to check employee auth status", error);
      setIsAuthenticated(false);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
        const storedClients = localStorage.getItem(CLIENT_LIST_KEY);
        if (!storedClients) {
            return { success: false, message: "Client data not found. Please contact support." };
        }
        
        const allClients: Client[] = JSON.parse(storedClients);

        for (const client of allClients) {
            const staffListKey = `staffList_${client.id}`;
            const storedStaff = localStorage.getItem(staffListKey);
            if (!storedStaff) continue;

            const staffList: Staff[] = JSON.parse(storedStaff);
            const staffMember = staffList.find(s => s.email === email && s.mobile === password);

            if (staffMember) {
                localStorage.setItem(AUTH_KEY, staffMember.id);
                localStorage.setItem(CLIENT_ID_KEY, client.id); // Set the client ID so providers work
                setIsAuthenticated(true);
                setCurrentEmployeeId(staffMember.id);
                return { success: true, staff: staffMember };
            }
        }
        
        return { success: false, message: "Invalid email or password." };

    } catch (error) {
        console.error("Failed to login employee", error);
        return { success: false, message: "An error occurred during login." };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(CLIENT_ID_KEY); // Clean up the shared key
      setIsAuthenticated(false);
      setCurrentEmployeeId(null);
      window.location.assign('/employee-login');
    } catch (error) {
        console.error("Failed to logout employee", error);
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, currentEmployeeId, login, logout };
}
