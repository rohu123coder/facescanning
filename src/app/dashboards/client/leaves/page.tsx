'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLeaveStore } from '@/hooks/use-leave-store';
import { useStaffStore } from '@/hooks/use-staff-store';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeaveManagementPage() {
    const { leaveRequests, updateLeaveRequestStatus, isInitialized: leavesInitialized } = useLeaveStore();
    const { staffList, isInitialized: staffInitialized } = useStaffStore();

    const isDataLoading = !leavesInitialized || !staffInitialized;

    const getStaffName = (employeeId: string) => {
        return staffList.find(s => s.id === employeeId)?.name || 'Unknown Staff';
    };

    const pendingRequests = useMemo(() => leaveRequests.filter(r => r.status === 'Pending'), [leaveRequests]);
    const approvedRequests = useMemo(() => leaveRequests.filter(r => r.status === 'Approved'), [leaveRequests]);
    const rejectedRequests = useMemo(() => leaveRequests.filter(r => r.status === 'Rejected'), [leaveRequests]);

    const renderRequestTable = (requests: typeof leaveRequests) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length > 0 ? (
                    requests.map(request => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">{getStaffName(request.employeeId)}</TableCell>
                            <TableCell><Badge variant="secondary">{request.leaveType}</Badge></TableCell>
                            <TableCell>
                                {format(parseISO(request.startDate), 'dd MMM yyyy')} - {format(parseISO(request.endDate), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                            <TableCell>{format(parseISO(request.createdAt), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-right">
                                {request.status === 'Pending' ? (
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => updateLeaveRequestStatus(request.id, 'Approved')}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => updateLeaveRequestStatus(request.id, 'Rejected')}>
                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge variant={request.status === 'Approved' ? 'default' : 'destructive'} className={request.status === 'Approved' ? 'bg-green-600' : ''}>
                                        {request.status}
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No requests in this category.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Leave Requests Management</h1>
                <p className="text-muted-foreground">Approve or reject leave requests submitted by employees.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="pending">
                        <div className="p-4 border-b">
                            <TabsList>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">History</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        {isDataLoading ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="ml-2 text-muted-foreground">Loading Requests...</p>
                            </div>
                        ) : (
                           <>
                            <TabsContent value="pending" className="m-0">
                                {renderRequestTable(pendingRequests)}
                            </TabsContent>
                            <TabsContent value="approved" className="m-0">
                                {renderRequestTable(approvedRequests)}
                            </TabsContent>
                            <TabsContent value="rejected" className="m-0">
                                {renderRequestTable(rejectedRequests)}
                            </TabsContent>
                           </>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
