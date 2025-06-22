'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileDown, Video, User, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Staff, type Student } from '@/lib/data';
import { generateAttendanceReportCsv, generateStudentAttendanceReportCsv } from '@/lib/actions';
import { AddStaffModal } from '@/components/add-staff-modal';
import { AddStudentModal } from '@/components/add-student-modal';
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useStudentStore } from '@/hooks/use-student-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClientDashboard() {
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');
  
  const { staffList, addStaff, isInitialized: staffInitialized } = useStaffStore();
  const { studentList, addStudent, isInitialized: studentInitialized } = useStudentStore();
  
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const handleGenerateCsv = async () => {
    let csvData;
    let fileName;
    if (activeTab === 'staff') {
      csvData = await generateAttendanceReportCsv(staffList);
      fileName = 'staff_attendance_report.csv';
    } else {
      csvData = await generateStudentAttendanceReportCsv(studentList);
      fileName = 'student_attendance_report.csv';
    }
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceStatus'>) => {
    addStaff(newStaff);
  };
  
  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'attendanceStatus'>) => {
    addStudent(newStudent);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your staff, students and view today's attendance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleGenerateCsv} disabled={(activeTab === 'staff' && staffList.length === 0) || (activeTab === 'student' && studentList.length === 0)}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button asChild>
            <Link href="/client/attendance-kiosk">
                <Video className="mr-2 h-4 w-4" />
                Open Attendance Kiosk
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-end">
          <TabsList>
            <TabsTrigger value="staff"><Users className="mr-2" /> Staff Management</TabsTrigger>
            <TabsTrigger value="student"><User className="mr-2" /> Student Management</TabsTrigger>
          </TabsList>
          {activeTab === 'staff' && (
             <Button onClick={() => setIsAddStaffModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          )}
          {activeTab === 'student' && (
             <Button onClick={() => setIsAddStudentModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>

        <TabsContent value="staff">
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
                  {!staffInitialized ? (
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
        </TabsContent>

        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle>Today's Student Attendance</CardTitle>
              <CardDescription>An overview of student attendance for today.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>Departure Time</TableHead>
                    <TableHead>Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!studentInitialized ? (
                     <TableRow><TableCell colSpan={6} className="text-center h-24">Loading student data...</TableCell></TableRow>
                  ) : studentList.length > 0 ? (
                    studentList.map((student) => {
                      const todaysAttendance = student.attendanceStatus?.date === todayStr ? student.attendanceStatus : null;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
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
                        </TableRow>
                      );
                    })
                  ) : (
                     <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No students added yet. Click "Add Student" to begin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddStaffModal 
        isOpen={isAddStaffModalOpen}
        onOpenChange={setIsAddStaffModalOpen}
        onStaffAdded={handleAddStaff}
      />
      <AddStudentModal 
        isOpen={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
        onStudentAdded={handleAddStudent}
      />
    </div>
  );
}
