
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { CheckSquare, FileText, HandCoins, Fingerprint, CalendarCheck2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
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
            icon: <Fingerprint className="text-muted-foreground" />,
            description: onLeaveToday ? 'Enjoy your day off!' : 'Mark your presence',
            href: '/dashboards/employee/attendance',
            cta: 'Mark Attendance'
        },
        {
            title: 'Pending Tasks',
            value: `${pendingTasksCount} Task(s)`,
            icon: <CheckSquare className="text-muted-foreground" />,
            description: 'Stay on top of your work',
            href: '/dashboards/employee/tasks',
            cta: 'View My Tasks'
        },
        {
            title: 'Leave Balances',
            value: `${employee.annualCasualLeaves} Casual | ${employee.annualSickLeaves} Sick`,
            icon: <CalendarCheck2 className="text-muted-foreground" />,
            description: 'Plan your time off',
            href: '/dashboards/employee/leaves',
            cta: 'Apply for Leave'
        },
        {
            title: 'My Payslips',
            value: latestSlip ? `Latest: ${latestSlip.month}` : 'No slips generated',
            icon: <HandCoins className="text-muted-foreground" />,
            description: 'View your salary details',
            href: '/dashboards/employee/payslips',
            cta: 'View Payslips'
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome, {employee.name}!</h1>
                <p className="text-muted-foreground">Here's your personal overview for today.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                        <CardFooter>
                           <Button asChild className="w-full">
                                <Link href={stat.href}>{stat.cta}</Link>
                            </Button>
                        </CardFooter>
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
