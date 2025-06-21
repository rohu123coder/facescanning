'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileDown, Video } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Staff } from '@/lib/data';
import { generateAttendanceReportCsv } from '@/lib/actions';
import { AddStaffModal } from '@/components/add-staff-modal';
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '@/hooks/use-staff-store';

export default function ClientDashboard() {
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const { staffList, addStaff, isInitialized } = useStaffStore();
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const handleGenerateCsv = async () => {
    const csvData = await generateAttendanceReportCsv(staffList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceStatus'>) => {
    addStaff(newStaff);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your staff and view today's attendance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleGenerateCsv} disabled={staffList.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Attendance Report
          </Button>
          <Button asChild>
            <Link href="/client/attendance-kiosk">
                <Video className="mr-2 h-4 w-4" />
                Open Attendance Kiosk
            </Link>
          </Button>
          <Button onClick={() => setIsAddStaffModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Staff Attendance</CardTitle>
          <CardDescription>An overview of staff attendance for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>In-Time</TableHead>
                <TableHead>Out-Time</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isInitialized ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading staff data...</TableCell></TableRow>
              ) : staffList.length > 0 ? (
                staffList.map((employee) => {
                  const todaysAttendance = employee.attendanceStatus?.date === todayStr ? employee.attendanceStatus : null;
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        {todaysAttendance?.inTime ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">{todaysAttendance.inTime}</Badge>
                        ) : (
                            <Badge variant="secondary">Not Logged</Badge>
                        )}
                      </TableCell>
                       <TableCell>
                        {todaysAttendance?.outTime ? (
                            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{todaysAttendance.outTime}</Badge>
                        ) : (
                            <Badge variant="secondary">Not Logged</Badge>
                        )}
                      </TableCell>
                       <TableCell>
                        {todaysAttendance?.totalHours ? (
                            <Badge variant="outline">{todaysAttendance.totalHours}</Badge>
                        ) : (
                           <Badge variant="secondary">--</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No staff members added yet. Click "Add Staff" to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddStaffModal 
        isOpen={isAddStaffModalOpen}
        onOpenChange={setIsAddStaffModalOpen}
        onStaffAdded={handleAddStaff}
      />
    </div>
  );
}
