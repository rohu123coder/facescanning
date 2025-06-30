
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
import { LayoutDashboard, LogOut, Mountain, User, CheckSquare, FileText, HandCoins, Fingerprint, CalendarDays } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import React, { useEffect, type ReactNode, useRef } from 'react';
import { useEmployeeAuthStore, EmployeeAuthStoreProvider } from '@/hooks/use-employee-auth-store.tsx';
import { ClientProvider, useClientStore } from '@/hooks/use-client-store.tsx';
import { StaffProvider } from '@/hooks/use-staff-store.tsx';
import { StudentProvider } from '@/hooks/use-student-store.tsx';
import { AttendanceProvider } from '@/hooks/use-attendance-store.tsx';
import { StudentAttendanceProvider } from '@/hooks/use-student-attendance-store.tsx';
import { LeaveProvider } from '@/hooks/use-leave-store.tsx';
import { TaskProvider } from '@/hooks/use-task-store.tsx';
import { SalaryRulesProvider } from '@/hooks/use-salary-rules-store.tsx';
import { SalarySlipsProvider } from '@/hooks/use-salary-slips-store.tsx';
import { HolidayProvider } from '@/hooks/use-holiday-store.tsx';
import { useToast } from '@/hooks/use-toast';

const navItems = [
    { href: '/dashboards/employee', label: 'Dashboard', icon: <LayoutDashboard /> },
    { href: '/dashboards/employee/attendance', label: 'Attendance', icon: <Fingerprint /> },
    { href: '/dashboards/employee/tasks', label: 'My Tasks', icon: <CheckSquare /> },
    { href: '/dashboards/employee/leaves', label: 'My Leaves', icon: <FileText /> },
    { href: '/dashboards/employee/payslips', label: 'My Payslips', icon: <HandCoins /> },
    { href: '/dashboards/employee/holidays', label: 'Holidays', icon: <CalendarDays /> },
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

function EmployeeDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized, logout, employee } = useEmployeeAuthStore();
  const { isInitialized: isClientInitialized } = useClientStore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);


  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      router.push('/employee-login');
    }
  }, [isAuthenticated, isAuthInitialized, router]);
  
  useEffect(() => {
    const playSound = () => audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
    
    const handleNewTask = (event: Event) => {
        const customEvent = event as CustomEvent;
        // Only notify if this employee is one of the assignees
        if(employee && customEvent.detail.assigneeIds.includes(employee.id)) {
            toast({
                title: "New Task Assigned!",
                description: `Task "${customEvent.detail.taskTitle}" has been assigned to you.`,
            });
            playSound();
        }
    };
    
    const handleNewComment = (event: Event) => {
        const customEvent = event as CustomEvent;
        
        // Prevent self-notification
        if(employee && customEvent.detail.authorId === employee.id) return;

        // Check if I am an assignee on the task.
        const isRecipient = employee && customEvent.detail.recipientIds.includes(employee.id);

        // Check if the comment is from the client-admin and I'm assigned
        const isClientCommentOnMyTask = employee && customEvent.detail.authorId === 'client-admin' && customEvent.detail.recipientIds.includes(employee.id);
        
        if (isRecipient || isClientCommentOnMyTask) {
            toast({
                title: `New Comment on "${customEvent.detail.taskTitle}"`,
                description: `${customEvent.detail.authorName} left a comment.`,
            });
            playSound();
        }
    };
    
    window.addEventListener('new-task-assigned', handleNewTask);
    window.addEventListener('new-task-comment', handleNewComment);

    return () => {
        window.removeEventListener('new-task-assigned', handleNewTask);
        window.removeEventListener('new-task-comment', handleNewComment);
    };
  }, [employee, toast]);


  if (!isAuthInitialized || !isAuthenticated || !employee || !isClientInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
          <span className="ml-2">Loading Employee Dashboard...</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboards/employee" className="flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground truncate">
              {employee.name}
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={item.href === '/dashboards/employee' ? pathname === item.href : pathname.startsWith(item.href)} tooltip={item.label}>
                        <Link href={item.href}>
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarHeader className="p-4 mt-auto">
           <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
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
                <ThemeToggle />
            </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background flex-1">
            <AllAppProviders>
              {children}
            </AllAppProviders>
            <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/notification_sound.ogg" preload="auto" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <EmployeeAuthStoreProvider>
            <ClientProvider>
                <EmployeeDashboard>
                    {children}
                </EmployeeDashboard>
            </ClientProvider>
        </EmployeeAuthStoreProvider>
    );
}
