'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeaveStore } from '@/hooks/use-leave-store';
import { useStaffStore } from '@/hooks/use-staff-store';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { LeaveRequest } from '@/lib/data';

export default function LeaveManagementPage() {
  const { leaves, approveLeave, rejectLeave, isInitialized: isLeavesInitialized } = useLeaveStore();
  const { staff, isInitialized: isStaffInitialized } = useStaffStore();
  const { toast } = useToast();

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.name || 'Unknown Staff';
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const leaveHistory = leaves.filter(l => l.status === 'Approved' || l.status === 'Rejected');
  
  const handleApprove = (leaveId: string) => {
    approveLeave(leaveId);
    toast({ title: "Leave Approved", description: "The leave request has been approved and marked as paid." });
  };

  const handleReject = (leaveId: string) => {
    rejectLeave(leaveId);
    toast({ variant: 'destructive', title: "Leave Rejected", description: "The leave request has been rejected and will be marked as unpaid." });
  };

  const getStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{status}</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">{status}</Badge>;
      case 'Pending':
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderLeaveTable = (data: LeaveRequest[], isPending = false, isHistory = false) => {
      if (!isLeavesInitialized || !isStaffInitialized) {
          return <p className="text-center p-8">Loading data...</p>
      }
      if (data.length === 0) {
          return <p className="text-center p-8">No records found.</p>
      }
      return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                {isHistory && <TableHead>Status</TableHead>}
                {isPending && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
                {data.map(leave => (
                    <TableRow key={leave.id}>
                        <TableCell className="font-medium">{getStaffName(leave.staffId)}</TableCell>
                        <TableCell>{leave.leaveType}</TableCell>
                        <TableCell>{format(parseISO(leave.startDate), 'PP')}</TableCell>
                        <TableCell>{format(parseISO(leave.endDate), 'PP')}</TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                        {isHistory && <TableCell>{getStatusBadge(leave.status)}</TableCell>}
                        {isPending && (
                            <TableCell className="text-right space-x-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">Reject</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will reject the leave request. This will be considered an unpaid leave. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleReject(leave.id)} className="bg-destructive hover:bg-destructive/90">
                                            Confirm Reject
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm">Approve</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will approve the leave request and deduct from the employee's leave balance. This will be a paid leave.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleApprove(leave.id)}>
                                            Confirm Approve
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Leave Management</h1>
        <p className="text-muted-foreground">Review and manage employee leave requests.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending Approval <Badge className="ml-2">{pendingLeaves.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved Leaves</TabsTrigger>
          <TabsTrigger value="history">Leave History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Review new leave requests and take action.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderLeaveTable(pendingLeaves, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Leaves</CardTitle>
              <CardDescription>A log of all currently approved and upcoming leaves.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderLeaveTable(approvedLeaves)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
              <CardDescription>A complete history of all past leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderLeaveTable(leaveHistory, false, true)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
