
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { format, parseISO } from 'date-fns';
import { ApplyLeaveModal } from '@/components/apply-leave-modal';
import { Check, ThumbsDown, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LeavesPage() {
  const { requests, approveRequest, rejectRequest, isInitialized } = useLeaveStore();
  const { staff } = useStaffStore();
  const { toast } = useToast();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'Unknown';
  
  const handleApprove = (id: string) => {
    approveRequest(id);
    toast({ title: 'Leave Approved', description: 'The leave request has been approved and quota updated.' });
  }

  const handleReject = (id: string) => {
    rejectRequest(id);
    toast({ title: 'Leave Rejected', description: 'The leave request has been rejected.' });
  }

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const history = requests.filter(r => r.status === 'Rejected' || r.status === 'Approved');
  
  const getStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
    switch(status) {
      case 'Pending': return <Badge variant="secondary">Pending</Badge>;
      case 'Approved': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Leave Management</h1>
            <p className="text-muted-foreground">Review, approve, or reject leave requests.</p>
          </div>
          <Button onClick={() => setIsApplyModalOpen(true)}>
             <UserCheck className="mr-2" /> Apply Leave (for staff)
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            <TabsTrigger value="approved">Approved Leaves</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>These leave requests are awaiting your decision.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInitialized && pendingRequests.length > 0 ? (
                      pendingRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{getStaffName(req.staffId)}</TableCell>
                          <TableCell>{req.leaveType}</TableCell>
                          <TableCell>{format(parseISO(req.startDate), 'PP')} - {format(parseISO(req.endDate), 'PP')}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleApprove(req.id)}><Check className="mr-2"/>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleReject(req.id)}><ThumbsDown className="mr-2"/>Reject</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No pending requests.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approved">
            <Card>
               <CardHeader>
                <CardTitle>Approved Requests</CardTitle>
                <CardDescription>These are upcoming or ongoing approved leaves.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInitialized && approvedRequests.length > 0 ? (
                      approvedRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{getStaffName(req.staffId)}</TableCell>
                          <TableCell>{req.leaveType}</TableCell>
                          <TableCell>{format(parseISO(req.startDate), 'PP')} - {format(parseISO(req.endDate), 'PP')}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="h-24 text-center">No approved leaves to show.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
               <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>A log of all past leave decisions.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                   <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isInitialized && history.length > 0 ? (
                      history.sort((a,b) => parseISO(b.requestDate).getTime() - parseISO(a.requestDate).getTime()).map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{getStaffName(req.staffId)}</TableCell>
                          <TableCell>{req.leaveType}</TableCell>
                          <TableCell>{format(parseISO(req.startDate), 'PP')} - {format(parseISO(req.endDate), 'PP')}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center">No leave history found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <ApplyLeaveModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} />
    </>
  );
}

