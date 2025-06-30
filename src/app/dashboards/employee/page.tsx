'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { CheckSquare, FileText, HandCoins, Fingerprint, CalendarCheck2, Briefcase, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

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
        const todayD = new Date();
        const start = parseISO(r.startDate);
        const end = parseISO(r.endDate);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return todayD >= start && todayD <= end;
    });

     if (onLeaveToday) {
        attendanceStatus = 'On Leave';
    }

    const stats = [
        {
            title: 'My Attendance',
            value: attendanceStatus,
            icon: <Fingerprint className="text-muted-foreground" />,
            href: '/dashboards/employee/attendance'
        },
        {
            title: 'Pending Tasks',
            value: `${pendingTasksCount} Task(s)`,
            icon: <CheckSquare className="text-muted-foreground" />,
            href: '/dashboards/employee/tasks'
        },
        {
            title: 'Casual Leave Balance',
            value: `${employee.annualCasualLeaves} Days`,
            icon: <CalendarCheck2 className="text-muted-foreground" />,
            href: '/dashboards/employee/leaves'
        },
        {
            title: 'Sick Leave Balance',
            value: `${employee.annualSickLeaves} Days`,
            icon: <FileText className="text-muted-foreground" />,
            href: '/dashboards/employee/leaves'
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome, {employee.name}!</h1>
                <p className="text-muted-foreground">Here's your personal overview for today.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <Link href={stat.href} className="block hover:bg-accent/50 transition-colors rounded-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                {stat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Briefcase/> Your Role</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Department:</span>
                            <span className="font-medium">{employee.department}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-medium">{employee.role}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Joining Date:</span>
                            <span className="font-medium">{format(parseISO(employee.joiningDate), 'PP')}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><HandCoins/> Latest Payslip</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center pt-6">
                        {latestSlip ? (
                            <>
                                <p className="text-lg">Payslip for <span className="font-bold">{latestSlip.month}, {latestSlip.year}</span> is available.</p>
                                <Button asChild className="mt-4">
                                    <Link href="/dashboards/employee/payslips">View All Payslips</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground">No payslips have been generated yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
