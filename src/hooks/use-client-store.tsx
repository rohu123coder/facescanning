
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Client, initialClients } from '@/lib/data';

const STORE_KEY = 'clientList';

interface ClientContextType {
  clients: Client[];
  currentClient: Client | null;
  addClient: (newClientData: Omit<Client, 'id'>) => void;
  updateClient: (updatedClientData: Client) => Promise<void>;
  isInitialized: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  useEffect(() => {
    try {
      const storedClients = localStorage.getItem(STORE_KEY);
      const loadedClients = storedClients ? JSON.parse(storedClients) : initialClients;
      setClients(loadedClients);
      if (!storedClients) {
          localStorage.setItem(STORE_KEY, JSON.stringify(initialClients));
      }

      const loggedInClientId = localStorage.getItem('loggedInClientId');
      if (loggedInClientId) {
          const clientData = loadedClients.find((c: Client) => c.id === loggedInClientId);
          setCurrentClient(clientData || null);
      }
    } catch (error) {
      console.error("Failed to load clients from localStorage", error);
      setClients(initialClients);
    }
    setIsInitialized(true);
  }, []);

  const addClient = useCallback((newClientData: Omit<Client, 'id'>) => {
    setClients(prevClients => {
      const newIdNumber = prevClients.length > 0 ? Math.max(0, ...prevClients.map(c => parseInt(c.id.split('-')[1], 10))) + 1 : 1;
      const newId = `C-${String(newIdNumber).padStart(3, '0')}`;
      const clientToAdd: Client = { ...newClientData, id: newId };
      const newList = [...prevClients, clientToAdd];
      localStorage.setItem(STORE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);
  
  const updateClient = useCallback(async (updatedClientData: Client) => {
    setClients(prevClients => {
      const updatedList = prevClients.map(client => 
        client.id === updatedClientData.id ? updatedClientData : client
      );
      localStorage.setItem(STORE_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
    // Update current client if it's the one being updated
    if (currentClient?.id === updatedClientData.id) {
        setCurrentClient(updatedClientData);
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  }, [currentClient?.id]);

  return (
    <ClientContext.Provider value={{ clients, currentClient, addClient, updateClient, isInitialized }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientStore() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientStore must be used within a ClientProvider');
  }
  return context;
}
