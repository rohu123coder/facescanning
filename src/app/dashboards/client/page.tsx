'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { useTaskStore } from '@/hooks/use-task-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useHolidayStore } from '@/hooks/use-holiday-store.tsx';
import { Users, GraduationCap, ListTodo, MailQuestion, Calendar, Mountain, Briefcase, ArrowRight } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboard() {
  const { staff, isInitialized: staffInitialized } = useStaffStore();
  const { students, isInitialized: studentsInitialized } = useStudentStore();
  const { tasks, isInitialized: tasksInitialized } = useTaskStore();
  const { requests, isInitialized: leavesInitialized } = useLeaveStore();
  const { holidays, isInitialized: holidaysInitialized } = useHolidayStore();

  const isDataLoading = !staffInitialized || !studentsInitialized || !tasksInitialized || !leavesInitialized || !holidaysInitialized;

  const totalStaff = staff.length;
  const totalStudents = students.length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const pendingTasksCount = pendingTasks.length;
  const pendingLeaves = requests.filter(r => r.status === 'Pending').length;
  
  const upcomingHolidays = holidays
    .filter(h => isFuture(parseISO(h.date)) || format(parseISO(h.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const statCards = [
    { title: 'Total Staff', value: totalStaff, icon: <Users className="h-4 w-4 text-muted-foreground" />, href: '/dashboards/client/staff' },
    { title: 'Total Students', value: totalStudents, icon: <GraduationCap className="h-4 w-4 text-muted-foreground" />, href: '/dashboards/client/students' },
    { title: 'Pending Tasks', value: pendingTasksCount, icon: <ListTodo className="h-4 w-4 text-muted-foreground" />, href: '/dashboards/client/tasks' },
    { title: 'Leave Requests', value: pendingLeaves, icon: <MailQuestion className="h-4 w-4 text-muted-foreground" />, href: '/dashboards/client/leaves' },
  ];

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Mountain className="h-8 w-8 text-primary animate-pulse" />
        <span className="ml-2">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Here's a quick overview of your organization.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <Link href={card.href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View Details <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar /> Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-4">
                {upcomingHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center justify-between">
                    <p className="font-medium">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">{format(parseISO(holiday.date), 'PPP')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">No upcoming holidays scheduled. You can add them in the Holidays section.</p>
            )}
             <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboards/client/holidays">
                Manage Holidays
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase /> Priority Tasks</CardTitle>
          </CardHeader>
          <CardContent>
             {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks
                    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 4)
                    .map(task => (
                        <Link href="/dashboards/client/tasks" key={task.id} className="block p-3 rounded-md hover:bg-muted transition-colors">
                           <div className="flex justify-between items-start">
                               <p className="font-semibold text-sm">{task.title}</p>
                               <Badge variant={task.priority === 'High' || task.priority === 'Urgent' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                           </div>
                           <p className="text-xs text-muted-foreground">Due: {format(parseISO(task.dueDate), 'PP')}</p>
                        </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">No pending tasks. Great job!</p>
            )}
             <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboards/client/tasks">
                View All Tasks
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
