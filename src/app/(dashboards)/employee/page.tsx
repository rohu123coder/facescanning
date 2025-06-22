'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { attendance } from '@/lib/data';
import { SalarySlip } from '@/components/salary-slip';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const getStatusBadge = (status: 'Present' | 'Absent' | 'Leave') => {
  switch (status) {
    case 'Present':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Absent':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Leave':
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
  }
};

export default function EmployeeDashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
        <p className="text-muted-foreground">Your personal attendance and salary information.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Name:</strong> Diya Patel</p>
                    <p><strong>Employee ID:</strong> KM-002</p>
                    <p><strong>Department:</strong> Design</p>
                    <p><strong>Role:</strong> UI/UX Designer</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Attendance Log</CardTitle>
                <CardDescription>Your attendance for the current pay period.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isClient ? (
                      attendance.map((record) => (
                        <TableRow key={record.date}>
                          <TableCell>{format(new Date(record.date), 'dd MMMM, yyyy')}</TableCell>
                          <TableCell className="text-right">{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
          <SalarySlip />
        </div>
      </div>
    </div>
  );
}
