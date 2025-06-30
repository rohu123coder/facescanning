
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { CalendarCheck2, FileText, PlusCircle, UserCheck } from 'lucide-react';
import { EmployeeApplyLeaveModal } from '@/components/employee-apply-leave-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const getStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch(status) {
      case 'Pending': return <Badge variant="secondary">Pending</Badge>;
      case 'Approved': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
    }
};

export default function MyLeavesPage() {
    const { employee } = useEmployeeAuthStore();
    const { requests, isInitialized } = useLeaveStore();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    if (!employee) {
        return <div>Loading...</div>;
    }
    
    const myRequests = requests.filter(r => r.staffId === employee.id);

    const stats = [
        { title: 'Casual Leave Balance', value: `${employee.annualCasualLeaves} Days`, icon: <CalendarCheck2 className="text-muted-foreground" /> },
        { title: 'Sick Leave Balance', value: `${employee.annualSickLeaves} Days`, icon: <FileText className="text-muted-foreground" /> },
    ];

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">My Leaves</h1>
            <p className="text-muted-foreground">Apply for leave and check your leave balance.</p>
          </div>
          <Button onClick={() => setIsApplyModalOpen(true)}>
             <PlusCircle className="mr-2" /> Apply for Leave
          </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
            {stats.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserCheck />
            My Leave Requests
          </CardTitle>
          <CardDescription>A history of all your leave applications.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {isInitialized && myRequests.length > 0 ? (
                      myRequests.sort((a,b) => parseISO(b.requestDate).getTime() - parseISO(a.requestDate).getTime()).map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{req.leaveType}</TableCell>
                          <TableCell>{format(parseISO(req.startDate), 'PP')} - {format(parseISO(req.endDate), 'PP')}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center">No leave requests found.</TableCell></TableRow>
                    )}
                </TableBody>
           </Table>
        </CardContent>
       </Card>
    </div>
    <EmployeeApplyLeaveModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} />
    </>
  );
}
