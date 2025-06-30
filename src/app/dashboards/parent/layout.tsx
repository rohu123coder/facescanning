
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Mountain, Shield, CalendarDays } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, type ReactNode, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ClientProvider, useClientStore } from '@/hooks/use-client-store.tsx';
import { StudentProvider } from '@/hooks/use-student-store.tsx';
import { StudentAttendanceProvider } from '@/hooks/use-student-attendance-store.tsx';
import { ParentAuthStoreProvider, useParentAuthStore } from '@/hooks/use-parent-auth-store.tsx';
import { HolidayProvider } from '@/hooks/use-holiday-store.tsx';

function AllAppProviders({ children }: { children: ReactNode }) {
    return (
        <StudentProvider>
            <StudentAttendanceProvider>
                <HolidayProvider>
                    {children}
                </HolidayProvider>
            </StudentAttendanceProvider>
        </StudentProvider>
    );
}

function ParentDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized, logout, student } = useParentAuthStore();
  const { isInitialized: isClientInitialized } = useClientStore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      router.push('/parent-login');
    }
  }, [isAuthenticated, isAuthInitialized, router]);

  useEffect(() => {
    const playSound = () => audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
    
    const handleStudentAttendance = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (student && customEvent.detail.studentId === student.id) {
            const message = customEvent.detail.punchType === 'in' 
                ? `${student.name} has checked in.`
                : `${student.name} has checked out.`;
            
            toast({
                title: "Attendance Notification",
                description: message,
            });
            playSound();
        }
    };
    
    window.addEventListener('student-attended', handleStudentAttendance);

    return () => {
        window.removeEventListener('student-attended', handleStudentAttendance);
    };
  }, [student, toast]);


  if (!isAuthInitialized || !isAuthenticated || !student || !isClientInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
          <span className="ml-2">Loading Parent Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <Link href="/dashboards/parent" className="mr-6 flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <div className='flex flex-col'>
                <span className="font-bold">Parent Portal</span>
                <span className="text-xs text-muted-foreground -mt-1">{student.name}</span>
            </div>
            </Link>
            <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboards/parent/holidays"><CalendarDays className="mr-2" /> Holidays</Link>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-2" /> Logout
            </Button>
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <AllAppProviders>
              {children}
            </AllAppProviders>
            <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/notification_sound.ogg" preload="auto" />
        </main>
    </div>
  );
}

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        // ClientProvider is necessary for other hooks to know which client's data to access
        <ClientProvider> 
            <ParentAuthStoreProvider>
                <ParentDashboard>
                    {children}
                </ParentDashboard>
            </ParentAuthStoreProvider>
        </ClientProvider>
    );
}
