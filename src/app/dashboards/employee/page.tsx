
'use client';

import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, FileText, UserCheck, HandCoins } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
    const { currentEmployeeId } = useEmployeeAuthStore();
    const { staff, isInitialized } = useStaffStore();

    const currentEmployee = staff.find(s => s.id === currentEmployeeId);

    if (!isInitialized || !currentEmployee) {
        return <div>Loading...</div>;
    }

    const featureCards = [
        { title: 'My Tasks', description: 'View and manage your assigned tasks.', icon: <CheckSquare className="h-8 w-8 text-muted-foreground" />, href: '/dashboards/employee/tasks' },
        { title: 'Apply for Leave', description: 'Submit and track your leave requests.', icon: <FileText className="h-8 w-8 text-muted-foreground" />, href: '/dashboards/employee/leaves' },
        { title: 'My Attendance', description: 'Check your attendance log and history.', icon: <UserCheck className="h-8 w-8 text-muted-foreground" />, href: '/dashboards/employee/attendance' },
        { title: 'My Payslips', description: 'View and download your salary slips.', icon: <HandCoins className="h-8 w-8 text-muted-foreground" />, href: '/dashboards/employee/payslips' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome back, {currentEmployee.name}!</h1>
                <p className="text-muted-foreground">This is your personal dashboard. Here's what you can do.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {featureCards.map(card => (
                    <Link href={card.href} key={card.title}>
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-headline">{card.title}</CardTitle>
                            {card.icon}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
            </div>
            
             <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No recent activity to display.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Company Announcements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No announcements at this time.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
