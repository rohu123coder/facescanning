
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { CheckSquare, FileText, HandCoins, Fingerprint, CalendarCheck2, Briefcase, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import React from 'react';

export default function EmployeeDashboardPage() {
    const { employee } = useEmployeeAuthStore();
    const { tasks } = useTaskStore();
    const { requests } = useLeaveStore();
    const { attendance } = useAttendanceStore();
    const { slips } = useSalarySlipsStore();

    if (!employee) {
        return <div>Loading...</div>;
    }

    // --- Data Calculation ---
    const myTasks = tasks.filter(task => task.assignedTo.includes(employee.id));
    const pendingTasksCount = myTasks.filter(task => task.status !== 'Done').length;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysAttendance = attendance.find(a => a.personId === employee.id && a.date === today);
    let attendanceStatus = 'Not Clocked In';
    if (todaysAttendance?.inTime && !todaysAttendance?.outTime) {
        attendanceStatus = `Clocked In at ${format(parseISO(todaysAttendance.inTime), 'p')}`;
    } else if (todaysAttendance?.inTime && todaysAttendance?.outTime) {
        attendanceStatus = `Clocked Out at ${format(parseISO(todaysAttendance.outTime), 'p')}`;
    }

    const latestSlip = slips
        .filter(s => s.staffId === employee.id)
        .sort((a, b) => new Date(`${b.month} 1, ${b.year}`).getTime() - new Date(`${a.month} 1, ${a.year}`).getTime())
        [0];

    const approvedLeaves = requests.filter(r => r.staffId === employee.id && r.status === 'Approved');
    const onLeaveToday = approvedLeaves.some(r => {
        const todayD = startOfDay(new Date());
        const start = startOfDay(parseISO(r.startDate));
        const end = startOfDay(parseISO(r.endDate));
        return todayD >= start && todayD <= end;
    });

     if (onLeaveToday) {
        attendanceStatus = 'On Approved Leave';
    }

    const stats = [
        {
            title: 'My Attendance',
            value: attendanceStatus,
            icon: <Fingerprint />,
            href: '/dashboards/employee/attendance',
        },
        {
            title: 'Pending Tasks',
            value: `${pendingTasksCount} Task(s)`,
            icon: <CheckSquare />,
            href: '/dashboards/employee/tasks',
        },
        {
            title: 'Leave Balances',
            value: `${employee.annualCasualLeaves} Casual | ${employee.annualSickLeaves} Sick`,
            icon: <CalendarCheck2 />,
            href: '/dashboards/employee/leaves',
        },
        {
            title: 'My Payslips',
            value: latestSlip ? `Latest: ${latestSlip.month}` : 'No slips generated',
            icon: <HandCoins />,
            href: '/dashboards/employee/payslips',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome, {employee.name}!</h1>
                <p className="text-muted-foreground">Here's your personal overview for today.</p>
            </div>
            
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                 {stats.map(stat => (
                    <Card key={stat.title} className="hover:bg-muted/50 transition-colors">
                        <Link href={stat.href} className="flex flex-row items-center p-4 gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                {React.cloneElement(stat.icon, { className: 'h-6 w-6' })}
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold">{stat.title}</p>
                                <p className="text-sm text-muted-foreground truncate" title={stat.value}>{stat.value}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Briefcase/> Your Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 text-sm">
                    <div className="flex justify-between md:flex-col md:justify-start">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{employee.department}</span>
                    </div>
                        <div className="flex justify-between md:flex-col md:justify-start">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-medium">{employee.role}</span>
                    </div>
                        <div className="flex justify-between md:flex-col md:justify-start">
                        <span className="text-muted-foreground">Joining Date</span>
                        <span className="font-medium">{format(parseISO(employee.joiningDate), 'PP')}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
