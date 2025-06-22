'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gem, LogOut, Mountain } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSuperAdminAuthStore } from '@/hooks/use-super-admin-auth-store';
import { useEffect } from 'react';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, isAuthInitialized } = useSuperAdminAuthStore();

  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated && pathname !== '/super-admin/login') {
      router.push('/super-admin/login');
    }
  }, [isAuthenticated, isAuthInitialized, router, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/super-admin/login');
  };

  if (pathname === '/super-admin/login') {
      return <main>{children}</main>;
  }

  if (!isAuthInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/super-admin" className="mr-6 flex items-center space-x-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="font-bold">Super Admin Panel</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
             <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
