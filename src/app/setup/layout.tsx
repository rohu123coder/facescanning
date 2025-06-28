'use client';

import { ClientProvider } from '@/hooks/use-client-store.tsx';
import type { ReactNode } from 'react';

export default function SetupLayout({ children }: { children: ReactNode }) {
  return <ClientProvider>{children}</ClientProvider>;
}
