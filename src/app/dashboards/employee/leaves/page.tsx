
'use client';

import { useState } from 'react';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { PlusCircle, FileText, Briefcase, HeartPulse } from 'lucide-react';
import { EmployeeApplyLeaveModal } from '@/components/employee-apply-leave-modal';
import type { Staff } from '@/lib/data';

const getStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
  switch(status) {
    case 'Pending': return <Badge variant="secondary">Pending</Badge>;
    case 'Approved': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
  }
};

export default function MyLeavesPage() {
  const { currentEmployeeId } = useEmployeeAuthStore();
  const { staff } = useStaffStore();
  const { requests, isInitialized } = useLeaveStore();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const currentEmployee = staff.find(s => s.id === currentEmployeeId);
  const myRequests = requests
    .filter(r => r.staffId === currentEmployeeId)
    .sort((a, b) => parseISO(b.requestDate).getTime() - parseISO(a.requestDate).getTime());

  if (!currentEmployee) {
    return <div>Loading...</div>;
  }

  const stats = [
    { title: 'Casual Leaves Remaining', value: currentEmployee.annualCasualLeaves, icon: <Briefcase className="text-muted-foreground" /> },
    { title: 'Sick Leaves Remaining', value: currentEmployee.annualSickLeaves, icon: <HeartPulse className="text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">My Leaves</h1>
            <p className="text-muted-foreground">Manage your leave requests and check your balance.</p>
          </div>
          <Button onClick={() => setIsApplyModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Apply for Leave
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
            <CardTitle className="flex items-center gap-2"><FileText /> My Leave History</CardTitle>
            <CardDescription>A log of all your past and pending leave requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isInitialized && myRequests.length > 0 ? (
                        myRequests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell>{format(parseISO(req.requestDate), 'PP')}</TableCell>
                                <TableCell>{req.leaveType}</TableCell>
                                <TableCell>{format(parseISO(req.startDate), 'PP')} - {format(parseISO(req.endDate), 'PP')}</TableCell>
                                <TableCell>{getStatusBadge(req.status)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {isInitialized ? "You haven't applied for any leaves yet." : "Loading leave history..."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EmployeeApplyLeaveModal
        isOpen={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        employee={currentEmployee}
      />
    </>
  );
}
