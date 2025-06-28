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
import { Briefcase, LogOut, Mountain, ClipboardCheck, CalendarCheck, Banknote, Users, User, Video, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useClientStore } from '@/hooks/use-client-store';
import { planFeatures, type Feature } from '@/lib/plans';
import { useEffect, useMemo } from 'react';
import Image from 'next/image';

const navConfig: { feature: Feature, href: string, label: string, icon: React.ElementType }[] = [
  { feature: 'DASHBOARD', href: '/dashboards/client', label: 'Dashboard', icon: Briefcase },
  { feature: 'ATTENDANCE_KIOSK', href: '/dashboards/client/attendance-kiosk', label: 'Attendance Kiosk', icon: Video },
  { feature: 'STUDENT_MANAGEMENT', href: '/dashboards/client', label: 'Students', icon: User },
  { feature: 'TASK_MANAGEMENT', href: '/dashboards/client/tasks', label: 'Task Management', icon: ClipboardCheck },
  { feature: 'LEAVE_MANAGEMENT', href: '/dashboards/client/leaves', label: 'Leave Requests', icon: CalendarCheck },
  { feature: 'SALARY_MANAGEMENT', href: '/dashboards/client/salary', label: 'Salary Management', icon: Banknote },
  { feature: 'REPUTATION_MANAGEMENT', href: '/dashboards/client/reputation', label: 'Reputation', icon: Star },
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

  const getIsActive = (itemHref: string, currentPath: string | null) => {
    if (!currentPath) {
      return false;
    }
    if (itemHref === '/dashboards/client') {
      return currentPath === '/dashboards/client';
    }
    return currentPath.startsWith(itemHref);
  };
  
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
            {navConfig.map((item) => {
              if (allowedFeatures.includes(item.feature)) {
                const key = item.href;
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
  if (pathname && pathname.startsWith('/dashboards/super-admin')) {
    return <>{children}</>;
  }

  // All other routes under (dashboards) get the client-side layout.
  return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
}
