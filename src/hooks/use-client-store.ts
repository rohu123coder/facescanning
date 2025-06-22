'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Client, initialClients } from '@/lib/data';

const STORE_KEY = 'clientList';

export function useClientStore() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  useEffect(() => {
    try {
      const storedClients = localStorage.getItem(STORE_KEY);
      if (storedClients) {
        setClients(JSON.parse(storedClients));
      } else {
        setClients(initialClients);
        localStorage.setItem(STORE_KEY, JSON.stringify(initialClients));
      }
    } catch (error) {
      console.error("Failed to load clients from localStorage", error);
      setClients(initialClients);
    }
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
      try {
        const loggedInClientId = localStorage.getItem('loggedInClientId');
        if (loggedInClientId) {
            const clientData = clients.find(c => c.id === loggedInClientId);
            setCurrentClient(clientData || null);
        } else {
            setCurrentClient(null);
        }
      } catch (error) {
          console.error("Failed to get current client", error);
          setCurrentClient(null);
      }
  }, [clients]);

  const updateClientList = useCallback((newList: Client[]) => {
    setClients(newList);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(newList));
    } catch (error) {
      console.error("Failed to save clients to localStorage", error);
    }
  }, []);

  const addClient = useCallback((newClientData: Omit<Client, 'id'>) => {
    const newIdNumber = clients.length > 0 ? Math.max(0, ...clients.map(c => parseInt(c.id.split('-')[1], 10))) + 1 : 1;
    const newId = `C-${String(newIdNumber).padStart(3, '0')}`;
    const clientToAdd: Client = { ...newClientData, id: newId };
    updateClientList([...clients, clientToAdd]);
  }, [clients, updateClientList]);
  
  const updateClient = useCallback(async (updatedClientData: Client) => {
    const updatedList = clients.map(client => 
      client.id === updatedClientData.id ? updatedClientData : client
    );
    updateClientList(updatedList);
    await new Promise(resolve => setTimeout(resolve, 100));
  }, [clients, updateClientList]);

  return { clients, currentClient, addClient, updateClient, isInitialized };
}
