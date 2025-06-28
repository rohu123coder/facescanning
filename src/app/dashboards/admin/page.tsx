'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '@/hooks/use-staff-store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const { staffList, isInitialized } = useStaffStore();

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const departments = useMemo(() => {
    if (!isInitialized) return [];
    return ['all', ...Array.from(new Set(staffList.map(s => s.department)))];
  }, [staffList, isInitialized]);

  const filteredStaffList = useMemo(() => {
    return staffList.filter(staff => {
      const nameMatch = staff.name.toLowerCase().includes(nameFilter.toLowerCase());
      const departmentMatch = departmentFilter === 'all' || staff.department === departmentFilter;
      return nameMatch && departmentMatch;
    });
  }, [staffList, nameFilter, departmentFilter]);

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
        </div>
        <Card>
          <CardHeader>
            <div>
                <CardTitle>Organization Staff List</CardTitle>
                <CardDescription>A comprehensive list of all employees in the system.</CardDescription>
            </div>
          </CardHeader>
           <CardContent className="border-t border-b p-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                  />
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Filter by department..." />
                      </SelectTrigger>
                      <SelectContent>
                          {departments.map(dept => <SelectItem key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</SelectItem>)}
                      </SelectContent>
                  </Select>
               </div>
          </CardContent>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isInitialized ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading staff data...
                    </TableCell>
                  </TableRow>
                ) : filteredStaffList.length > 0 ? (
                  filteredStaffList.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                       <TableCell>{employee.email}</TableCell>
                       <TableCell>{employee.mobile}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No staff members found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
