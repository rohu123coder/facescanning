'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '@/hooks/use-staff-store';

export default function AdminDashboard() {
  const { staffList, isInitialized } = useStaffStore();

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Staff List</CardTitle>
          <CardDescription>A comprehensive list of all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isInitialized ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading staff data...
                  </TableCell>
                </TableRow>
              ) : staffList.length > 0 ? (
                staffList.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                       <Badge variant="outline">{employee.department}</Badge>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No staff members found. Add staff from the Client dashboard.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
