
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Briefcase, LogOut, Mountain, Users, ScanFace, Star, CheckSquare, GraduationCap, FileText, HandCoins, CalendarDays, UserCheck, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/hooks/use-auth-store';
import { ClientProvider, useClientStore } from '@/hooks/use-client-store.tsx';
import { useEffect, type ReactNode, useRef } from 'react';
import Image from 'next/image';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { useToast } from '@/hooks/use-toast';
import { useHolidayStore, HolidayProvider } from '@/hooks/use-holiday-store.tsx';
import { isToday, isTomorrow, parseISO, startOfDay, format } from 'date-fns';
import { StaffProvider } from '@/hooks/use-staff-store.tsx';
import { StudentProvider } from '@/hooks/use-student-store.tsx';
import { AttendanceProvider } from '@/hooks/use-attendance-store.tsx';
import { StudentAttendanceProvider } from '@/hooks/use-student-attendance-store.tsx';
import { LeaveProvider } from '@/hooks/use-leave-store.tsx';
import { TaskProvider } from '@/hooks/use-task-store.tsx';
import { SalaryRulesProvider } from '@/hooks/use-salary-rules-store.tsx';
import { SalarySlipsProvider } from '@/hooks/use-salary-slips-store.tsx';


const navItems = [
    { href: '/dashboards/client', label: 'Dashboard', icon: <Briefcase />, feature: 'DASHBOARD' },
    { href: '/dashboards/client/staff', label: 'Staff', icon: <Users />, feature: 'STAFF_MANAGEMENT' },
    { href: '/dashboards/client/students', label: 'Students', icon: <GraduationCap />, feature: 'STUDENT_MANAGEMENT' },
    { href: '/dashboards/client/tasks', label: 'Tasks', icon: <CheckSquare />, feature: 'TASK_MANAGEMENT' },
    { href: '/dashboards/client/leaves', label: 'Leaves', icon: <FileText />, feature: 'LEAVE_MANAGEMENT' },
    { href: '/dashboards/client/holidays', label: 'Holidays', icon: <CalendarDays />, feature: 'HOLIDAY_MANAGEMENT' },
    { href: '/dashboards/client/salary', label: 'Salary', icon: <HandCoins />, feature: 'SALARY_AUTOMATION' },
    { href: '/dashboards/client/attendance-kiosk', label: 'Attendance Kiosk', icon: <ScanFace />, feature: 'ATTENDANCE_KIOSK' },
    { href: '/dashboards/client/reputation', label: 'Reputation', icon: <Star />, feature: 'REPUTATION_MANAGEMENT' },
];


function AllAppProviders({ children }: { children: ReactNode }) {
    return (
        <StaffProvider>
            <StudentProvider>
                <AttendanceProvider>
                    <StudentAttendanceProvider>
                        <LeaveProvider>
                            <TaskProvider>
                                <SalaryRulesProvider>
                                    <SalarySlipsProvider>
                                        <HolidayProvider>
                                            {children}
                                        </HolidayProvider>
                                    </SalarySlipsProvider>
                                </SalaryRulesProvider>
                            </TaskProvider>
                        </LeaveProvider>
                    </StudentAttendanceProvider>
                </AttendanceProvider>
            </StudentProvider>
        </StaffProvider>
    );
}

function MainDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, isAuthInitialized } = useAuthStore();
  const { currentClient } = useClientStore();
  const { hasFeature } = usePlanFeatures();
  const { holidays, isInitialized: holidaysInitialized } = useHolidayStore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isAuthInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentClient && !currentClient.isSetupComplete && pathname !== '/setup') {
        router.push('/setup');
      }
    }
  }, [isAuthenticated, isAuthInitialized, router, currentClient, pathname]);
  
  useEffect(() => {
    const playSound = () => audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
    
    const handleNewLeaveRequest = (event: Event) => {
        const customEvent = event as CustomEvent;
        toast({
            title: "New Leave Request",
            description: `${customEvent.detail.staffName} has applied for ${customEvent.detail.leaveType} leave.`,
        });
        playSound();
    };
    
    if (holidaysInitialized) {
        const checkHolidays = () => {
            const upcomingHolidays = holidays.filter(h => {
                const holidayDate = startOfDay(parseISO(h.date));
                return isToday(holidayDate) || isTomorrow(holidayDate);
            });
            upcomingHolidays.forEach(holiday => {
                const notificationKey = `notified_holiday_${holiday.id}`;
                if (!sessionStorage.getItem(notificationKey)) {
                    toast({
                        title: 'Upcoming Holiday Reminder',
                        description: `${holiday.name} on ${format(parseISO(holiday.date), 'PPP')}.`,
                    });
                    playSound();
                    sessionStorage.setItem(notificationKey, 'true');
                }
            });
        };
        checkHolidays();
    }
    
    const handleNewComment = (event: Event) => {
        const customEvent = event as CustomEvent;
        // Only notify the client if the author is not the client themselves
        if (customEvent.detail.authorId !== 'client-admin') {
            toast({
                title: `New Comment on "${customEvent.detail.taskTitle}"`,
                description: `${customEvent.detail.authorName} left a comment.`,
            });
            playSound();
        }
    };

    window.addEventListener('new-leave-request', handleNewLeaveRequest);
    window.addEventListener('new-task-comment', handleNewComment);


    return () => {
        window.removeEventListener('new-leave-request', handleNewLeaveRequest);
        window.removeEventListener('new-task-comment', handleNewComment);
    };
  }, [holidaysInitialized, holidays, toast]);

  const handleLogout = () => logout();

  if (!isAuthInitialized || !isAuthenticated || !currentClient) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (pathname === '/setup') {
      return <main>{children}</main>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboards/client" className="flex items-center gap-2">
            <Image src={currentClient.logoUrl || `https://placehold.co/100x100.png`} alt="Logo" width={32} height={32} className="rounded-md" data-ai-hint="logo" />
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground truncate">
              {currentClient.organizationName}
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                hasFeature(item.feature as any) && (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                            <Link href={item.href}>
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarHeader className="p-4 mt-auto">
           <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
             <LogOut />
             <span>Logout</span>
           </Button>
         </SidebarHeader>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:justify-end">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
                <span className="font-semibold">{currentClient.plan} Plan</span>
                <ThemeToggle />
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboards/client/settings">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                    </Link>
                </Button>
            </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background flex-1">
            {children}
            <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/notification_sound.ogg" preload="auto" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MainDashboard({ children }: { children: React.ReactNode }) {
    const { currentClient, isInitialized } = useClientStore();

    if (!isInitialized || !currentClient) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Mountain className="h-8 w-8 text-primary animate-pulse" />
            </div>
        );
    }
    
    return (
        <AllAppProviders key={currentClient.id}>
            <MainDashboardLayout>{children}</MainDashboardLayout>
        </AllAppProviders>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  
  // Super Admin has its own isolated layout and providers
  if (pathname && pathname.startsWith('/dashboards/super-admin')) {
    return (
      <ClientProvider>
          {children}
      </ClientProvider>
    );
  }

  // Employee dashboard has its own self-contained layout.
  // We return the children directly, and Next.js will use the layout defined in /dashboards/employee/layout.tsx.
  if (pathname && pathname.startsWith('/dashboards/employee')) {
    return <>{children}</>;
  }

  // All other dashboards (Client) use this layout
  return (
    <ClientProvider>
      <MainDashboard>{children}</MainDashboard>
    </ClientProvider>
  );
}
