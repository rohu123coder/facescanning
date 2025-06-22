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
import { Briefcase, LogOut, Mountain, ClipboardCheck, CalendarCheck, Banknote, Users, User, Video } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useClientStore } from '@/hooks/use-client-store';
import { planFeatures, type Feature } from '@/lib/plans';
import { useEffect, useMemo } from 'react';
import Image from 'next/image';

const navConfig: { feature: Feature, href: string, label: string, icon: React.ElementType }[] = [
  { feature: 'DASHBOARD', href: '/client', label: 'Dashboard', icon: Briefcase },
  { feature: 'ATTENDANCE_KIOSK', href: '/client/attendance-kiosk', label: 'Attendance Kiosk', icon: Video },
  { feature: 'STAFF_MANAGEMENT', href: '/client', label: 'Staff', icon: Users },
  { feature: 'STUDENT_MANAGEMENT', href: '/client', label: 'Students', icon: User },
  { feature: 'TASK_MANAGEMENT', href: '/client/tasks', label: 'Task Management', icon: ClipboardCheck },
  { feature: 'LEAVE_MANAGEMENT', href: '/client/leaves', label: 'Leave Requests', icon: CalendarCheck },
  { feature: 'SALARY_MANAGEMENT', href: '/client/salary', label: 'Salary Management', icon: Banknote },
];


function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, isAuthInitialized } = useAuthStore();
  const { currentClient } = useClientStore();

  useEffect(() => {
    if (isAuthInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentClient && !currentClient.isSetupComplete && pathname !== '/setup') {
        router.push('/setup');
      }
    }
  }, [isAuthenticated, isAuthInitialized, router, currentClient, pathname]);

  const clientPlan = currentClient?.plan || 'Basic';
  const allowedFeatures = useMemo(() => planFeatures[clientPlan], [clientPlan]);

  const getIsActive = (itemHref: string, currentPath: string) => {
    if (itemHref === '/client') {
      return currentPath === '/client';
    }
    return currentPath.startsWith(itemHref);
  };
  
  const handleLogout = () => {
    logout();
    router.push('/login');
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
          <Link href="/client" className="flex items-center gap-2">
            <Image src={currentClient.logoUrl || `https://placehold.co/100x100.png`} alt="Logo" width={32} height={32} className="rounded-md" data-ai-hint="logo" />
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground truncate">
              {currentClient.organizationName}
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navConfig.map((item) => {
              if (allowedFeatures.includes(item.feature)) {
                // Special handling for staff and student links to avoid duplicate keys
                const key = item.feature === 'STAFF_MANAGEMENT' ? `${item.href}-staff` : item.feature === 'STUDENT_MANAGEMENT' ? `${item.href}-student` : item.href;
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      asChild
                      isActive={getIsActive(item.href, pathname)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }
              return null;
            })}
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
  
  // If the path is for super-admin, we bypass the client layout entirely.
  // This allows the super-admin's own layout to handle its auth and UI.
  if (pathname.startsWith('/super-admin')) {
    return <>{children}</>;
  }

  // All other routes under (dashboards) get the client-side layout.
  return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
}
