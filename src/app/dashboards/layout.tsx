
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
import { Briefcase, LogOut, Mountain, Users, ScanFace, Star, CheckSquare, GraduationCap, FileText, HandCoins } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/hooks/use-auth-store';
import { ClientProvider, useClientStore } from '@/hooks/use-client-store';
import { useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { usePlanFeatures } from '@/hooks/use-plan-features';

import { StaffProvider } from '@/hooks/use-staff-store';
import { StudentProvider } from '@/hooks/use-student-store';
import { AttendanceProvider } from '@/hooks/use-attendance-store';
import { StudentAttendanceProvider } from '@/hooks/use-student-attendance-store';
import { LeaveProvider } from '@/hooks/use-leave-store';
import { TaskProvider } from '@/hooks/use-task-store';
import { SalaryRulesProvider } from '@/hooks/use-salary-rules-store';


const navItems = [
    { href: '/dashboards/client', label: 'Dashboard', icon: <Briefcase />, feature: 'DASHBOARD' },
    { href: '/dashboards/client/staff', label: 'Staff', icon: <Users />, feature: 'STAFF_MANAGEMENT' },
    { href: '/dashboards/client/students', label: 'Students', icon: <GraduationCap />, feature: 'STUDENT_MANAGEMENT' },
    { href: '/dashboards/client/tasks', label: 'Tasks', icon: <CheckSquare />, feature: 'TASK_MANAGEMENT' },
    { href: '/dashboards/client/leaves', label: 'Leaves', icon: <FileText />, feature: 'LEAVE_MANAGEMENT' },
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
                                    {children}
                                </SalaryRulesProvider>
                            </TaskProvider>
                        </LeaveProvider>
                    </StudentAttendanceProvider>
                </AttendanceProvider>
            </StudentProvider>
        </StaffProvider>
    );
}

function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, isAuthInitialized } = useAuthStore();
  const { currentClient } = useClientStore();
  const { hasFeature } = usePlanFeatures();

  useEffect(() => {
    if (isAuthInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentClient && !currentClient.isSetupComplete && pathname !== '/setup') {
        router.push('/setup');
      }
    }
  }, [isAuthenticated, isAuthInitialized, router, currentClient, pathname]);
  
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
            </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background flex-1">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  if (pathname && pathname.startsWith('/dashboards/super-admin')) {
    // Super-admin pages only need the ClientProvider for managing clients
    return (
      <ClientProvider>
          {children}
      </ClientProvider>
    );
  }

  // Client dashboard pages need all providers
  return (
    <ClientProvider>
      <AllAppProviders>
        <ClientDashboardLayout>{children}</ClientDashboardLayout>
      </AllAppProviders>
    </ClientProvider>
  );
}
