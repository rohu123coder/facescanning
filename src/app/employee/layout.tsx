'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Mountain, User, Briefcase } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useEffect } from 'react';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, currentEmployee, logout, isAuthInitialized } = useEmployeeAuthStore();

  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      router.push('/employee-login');
    }
  }, [isAuthenticated, isAuthInitialized, router]);

  const handleLogout = () => {
    logout();
  };
  
  if (!isAuthInitialized || !isAuthenticated || !currentEmployee) {
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
          <Link href="/employee" className="mr-6 flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="font-bold hidden sm:inline-block">Employee Portal</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <span className="font-semibold text-sm hidden md:inline">
                Welcome, {currentEmployee.name}
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
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
