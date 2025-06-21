'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileDown, Camera, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Staff } from '@/lib/data';
import { generateSalaryCsv } from '@/lib/actions';
import { FaceScanModal } from '@/components/face-scan-modal';
import { AddStaffModal } from '@/components/add-staff-modal';
import { Badge } from '@/components/ui/badge';

export default function ClientDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const handleGenerateCsv = async () => {
    const csvData = await generateSalaryCsv(staffList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'salary_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openFaceScan = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };
  
  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceStatus'>) => {
    const newIdNumber = staffList.length > 0 ? Math.max(0, ...staffList.map(s => parseInt(s.id.split('-')[1], 10))) + 1 : 1;
    const newId = `KM-${String(newIdNumber).padStart(3, '0')}`;
    setStaffList(prev => [...prev, { ...newStaff, id: newId, attendanceStatus: null }]);
  };

  const handleAttendanceSuccess = (staffId: string) => {
    const now = new Date();
    setStaffList(prevStaffList =>
      prevStaffList.map(s =>
        s.id === staffId
          ? {
              ...s,
              attendanceStatus: {
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: now.toLocaleDateString('en-GB'),
              },
            }
          : s
      )
    );
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your staff and their attendance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleGenerateCsv} disabled={staffList.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Salary Report
          </Button>
          <Button onClick={() => setIsAddStaffModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>A list of all employees in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Salary (INR)</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.length > 0 ? (
                staffList.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      {employee.attendanceStatus ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Logged at {employee.attendanceStatus.time}
                          </Badge>
                      ) : (
                          <Badge variant="secondary" className="whitespace-nowrap">Not Logged</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{employee.salary.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => openFaceScan(employee)}>
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Log Attendance</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No staff members added yet. Click "Add Staff" to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedStaff && (
        <FaceScanModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          staffMember={selectedStaff}
          onAttendanceSuccess={handleAttendanceSuccess}
        />
      )}

      <AddStaffModal 
        isOpen={isAddStaffModalOpen}
        onOpenChange={setIsAddStaffModalOpen}
        onStaffAdded={handleAddStaff}
      />
    </div>
  );
}
