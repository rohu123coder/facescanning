
'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Review, initialReviews } from '@/lib/data';
import { useClientStore } from './use-client-store.tsx';

// In a real app, this data would be fetched from an API.
// For this simulation, we use static data.

interface ReputationContextType {
  reviews: Review[];
  isInitialized: boolean;
}

const ReputationContext = createContext<ReputationContextType | undefined>(undefined);

export function ReputationProvider({ children }: { children: ReactNode }) {
  const { currentClient } = useClientStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load static data on mount. No need to use localStorage for this simulation.
  useEffect(() => {
    // Only load reviews if the client has connected their GBP.
    if (currentClient?.isGbpConnected) {
        setReviews(initialReviews);
    } else {
        setReviews([]);
    }
    setIsInitialized(true);
  }, [currentClient]);


  return (
    <ReputationContext.Provider value={{ reviews, isInitialized }}>
      {children}
    </ReputationContext.Provider>
  );
}

export function useReputationStore() {
  const context = useContext(ReputationContext);
  if (context === undefined) {
    throw new Error('useReputationStore must be used within a ReputationProvider');
  }
  return context;
}
