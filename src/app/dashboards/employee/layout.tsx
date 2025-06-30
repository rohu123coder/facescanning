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
import { LayoutDashboard, LogOut, Mountain, User, CheckSquare, FileText, HandCoins, Fingerprint } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEffect, type ReactNode } from 'react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';

const navItems = [
    { href: '/dashboards/employee', label: 'Dashboard', icon: <LayoutDashboard /> },
    { href: '/dashboards/employee/attendance', label: 'Attendance', icon: <Fingerprint /> },
    { href: '/dashboards/employee/tasks', label: 'My Tasks', icon: <CheckSquare /> },
    { href: '/dashboards/employee/leaves', label: 'My Leaves', icon: <FileText /> },
    { href: '/dashboards/employee/payslips', label: 'My Payslips', icon: <HandCoins /> },
];

function EmployeeDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized, logout, employee } = useEmployeeAuthStore();

  useEffect(() => {
    if (isAuthInitialized && !isAuthenticated) {
      router.push('/employee-login');
    }
  }, [isAuthenticated, isAuthInitialized, router]);

  if (!isAuthInitialized || !isAuthenticated || !employee) {
    return (
      <div className="flex items-center justify-center h-screen">
          <Mountain className="h-8 w-8 text-primary animate-pulse" />
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
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
    // This provider is needed for the auth hook to work correctly.
    // It will be expanded later with other employee-specific providers.
    return (
        <EmployeeAuthStoreProvider>
            <EmployeeDashboard>
                {children}
            </EmployeeDashboard>
        </EmployeeAuthStoreProvider>
    );
}

// Minimal provider to avoid errors. Will be expanded.
const EmployeeAuthStoreContext = React.createContext(undefined as any);
function EmployeeAuthStoreProvider({ children }: { children: React.ReactNode }) {
    return <EmployeeAuthStoreContext.Provider value={{}}>{children}</EmployeeAuthStoreContext.Provider>;
}
