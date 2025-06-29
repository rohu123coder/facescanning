
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
import { Briefcase, LogOut, Mountain, Users, ScanFace, Star, CheckSquare, GraduationCap, FileText, HandCoins, CalendarDays, UserCheck, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { ClientProvider, useClientStore } from '@/hooks/use-client-store.tsx';
import { useEffect, type ReactNode, useRef } from 'react';
import Image from 'next/image';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { useToast } from '@/hooks/use-toast';
import { useHolidayStore, HolidayProvider } from '@/hooks/use-holiday-store.tsx';
import { isToday, isTomorrow, parseISO, startOfDay, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStaffStore, StaffProvider } from '@/hooks/use-staff-store.tsx';
import { StudentProvider } from '@/hooks/use-student-store.tsx';
import { AttendanceProvider } from '@/hooks/use-attendance-store.tsx';
import { StudentAttendanceProvider } from '@/hooks/use-student-attendance-store.tsx';
import { LeaveProvider } from '@/hooks/use-leave-store.tsx';
import { useTaskStore, TaskProvider } from '@/hooks/use-task-store.tsx';
import { SalaryRulesProvider } from '@/hooks/use-salary-rules-store.tsx';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const clientNavItems = [
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

const employeeNavItems = [
    { href: '/dashboards/employee', label: 'Dashboard', icon: <Briefcase /> },
    { href: '/dashboards/employee/tasks', label: 'My Tasks', icon: <CheckSquare /> },
    { href: '/dashboards/employee/leaves', label: 'My Leaves', icon: <FileText /> },
    { href: '/dashboards/employee/attendance', label: 'My Attendance', icon: <UserCheck /> },
    { href: '/dashboards/employee/payslips', label: 'My Payslips', icon: <HandCoins /> },
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
                                    <HolidayProvider>
                                        {children}
                                    </HolidayProvider>
                                </SalaryRulesProvider>
                            </TaskProvider>
                        </LeaveProvider>
                    </StudentAttendanceProvider>
                </AttendanceProvider>
            </StudentProvider>
        </StaffProvider>
    );
}

function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
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
    if (!holidaysInitialized) return;

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
                audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
                sessionStorage.setItem(notificationKey, 'true');
            }
        });
    };

    checkHolidays();
  }, [holidaysInitialized, holidays, toast]);
  
   useEffect(() => {
    const playSound = () => {
        audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
    };
    window.addEventListener('play-task-notification', playSound);
    return () => {
        window.removeEventListener('play-task-notification', playSound);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (!isAuthInitialized || !isAuthenticated || !currentClient) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  // Hide layout for setup page
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
            {clientNavItems.map((item) => (
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
            <ClientDashboardLayout>{children}</ClientDashboardLayout>
        </AllAppProviders>
    )
}

function EmployeeDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, isAuthInitialized, currentEmployeeId } = useEmployeeAuthStore();
  const { staff } = useStaffStore();
  const { tasks, isInitialized: tasksInitialized } = useTaskStore();
  const { toast } = useToast();
  const prevAssignedTaskIdsRef = useRef<string[]>([]);
  const isInitialLoadRef = useRef(true);
  
  const currentEmployee = staff.find(s => s.id === currentEmployeeId);
  
  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      router.push('/employee-login');
    }
  }, [isAuthenticated, isAuthInitialized, router]);

  // Effect for new task notifications
  useEffect(() => {
    if (!tasksInitialized || !currentEmployeeId) return;

    const currentAssignedTasks = tasks.filter(t => t.assignedTo.includes(currentEmployeeId));
    const currentAssignedTaskIds = currentAssignedTasks.map(t => t.id);
    
    // On initial load, just set the reference and bail.
    if (isInitialLoadRef.current) {
        prevAssignedTaskIdsRef.current = currentAssignedTaskIds;
        isInitialLoadRef.current = false;
        return;
    }

    const newTasks = currentAssignedTasks.filter(task => !prevAssignedTaskIdsRef.current.includes(task.id));
    
    if (newTasks.length > 0) {
        const latestNewTask = newTasks[newTasks.length - 1];
        toast({
            title: "New Task Assigned!",
            description: `You have a new task: "${latestNewTask.title}"`,
        });
        const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
        audioEl?.play().catch(e => console.error("Audio playback failed", e));
    }

    prevAssignedTaskIdsRef.current = currentAssignedTaskIds;

  }, [tasks, tasksInitialized, currentEmployeeId, toast]);

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
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
           <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href="/dashboards/employee" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Briefcase className="h-6 w-6 text-primary" />
                    <span className="sr-only">Employee Dashboard</span>
                </Link>
                {employeeNavItems.map(item => (
                    <Link key={item.label} href={item.href} className={cn("transition-colors hover:text-foreground", pathname === item.href ? "text-foreground" : "text-muted-foreground")}>
                        {item.label}
                    </Link>
                ))}
           </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto flex-1 sm:flex-initial">
                   {/* Future search bar */}
                </div>
                 <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentEmployee.photoUrl} alt={currentEmployee.name} />
                        <AvatarFallback>{currentEmployee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{currentEmployee.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
            <audio id="notification-sound" src="https://actions.google.com/sounds/v1/alarms/notification_sound.ogg" preload="auto" />
        </main>
      </div>
  )
}

function EmployeeMainDashboard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isAuthInitialized } = useEmployeeAuthStore();
     const { currentClient, isInitialized: isClientInitialized } = useClientStore();

    if (!isAuthInitialized || !isAuthenticated || !isClientInitialized || !currentClient) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Mountain className="h-8 w-8 text-primary animate-pulse" />
            </div>
        );
    }
    
    // Key is crucial to reset providers when a different employee from a different client logs in
    return (
        <AllAppProviders key={currentClient.id}>
            <EmployeeDashboardLayout>{children}</EmployeeDashboardLayout>
        </AllAppProviders>
    )
}


export default function DashboardLayout({ children, }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  
  if (pathname && pathname.startsWith('/dashboards/super-admin')) {
    return (
      <ClientProvider>
          {children}
      </ClientProvider>
    );
  }

  if (pathname && pathname.startsWith('/dashboards/employee')) {
    return (
      <ClientProvider>
          <EmployeeMainDashboard>{children}</EmployeeMainDashboard>
      </ClientProvider>
    )
  }

  // Client dashboard pages are the default
  return (
    <ClientProvider>
      <MainDashboard>{children}</MainDashboard>
    </ClientProvider>
  );
}
