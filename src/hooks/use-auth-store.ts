'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientStore } from './use-client-store';
import { type Client } from '@/lib/data';

const AUTH_KEY = 'loggedInClientId';
const CLIENT_STORE_KEY = 'clientList';

export function useAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  
  useEffect(() => {
    try {
      const loggedInClientId = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(!!loggedInClientId);
    } catch (error) {
      console.error("Failed to check auth status", error);
      setIsAuthenticated(false);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; client?: Client; }> => {
    try {
        const storedClients = localStorage.getItem(CLIENT_STORE_KEY);
        if (!storedClients) {
            return { success: false, message: "Client data not found. Please contact support." };
        }
        
        const allClients: Client[] = JSON.parse(storedClients);
        const client = allClients.find(c => c.email === email);

        // For this simulation, the password is the client's mobile number
        if (client && client.mobile === password) {
          localStorage.setItem(AUTH_KEY, client.id);
          setIsAuthenticated(true);
          // Add a small delay to allow other stores to react to the auth change
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true, client: client };
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
    } catch (error) {
        console.error("Failed to logout", error);
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, login, logout };
}
