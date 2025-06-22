'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileDown, Video, User, Users, Printer, Calendar as CalendarIcon, X, Banknote } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Staff, type Student, type AttendanceRecord } from '@/lib/data';
import { AddStaffModal } from '@/components/add-staff-modal';
import { AddStudentModal } from '@/components/add-student-modal';
import { EditStudentModal } from '@/components/edit-student-modal';
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useStudentStore } from '@/hooks/use-student-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ClientDashboard() {
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState('staff');
  const [studentView, setStudentView] = useState('list');
  const { toast } = useToast();

  // Filter states
  const [staffNameFilter, setStaffNameFilter] = useState('');
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState('all');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  
  useEffect(() => {
    setDate({
      from: new Date(),
      to: new Date(),
    });
  }, []);
  
  const { staffList, addStaff, isInitialized: staffInitialized } = useStaffStore();
  const { studentList, addStudent, updateStudent, deleteStudent, isInitialized: studentInitialized } = useStudentStore();
  
  // Memoized lists for filter options
  const staffDepartments = useMemo(() => {
    if (!staffInitialized) return [];
    return ['all', ...Array.from(new Set(staffList.map(s => s.department)))];
  }, [staffList, staffInitialized]);

  const studentClasses = useMemo(() => {
    if (!studentInitialized) return [];
    return ['all', ...Array.from(new Set(studentList.map(s => s.className)))];
  }, [studentList, studentInitialized]);
  
  const classStrength = useMemo(() => {
    if (!studentInitialized) return {};
    return studentList.reduce((acc, student) => {
      const className = student.className || 'Unassigned';
      if(acc[className]) {
        acc[className]++;
      } else {
        acc[className] = 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [studentList, studentInitialized]);

  const staffAttendanceList = useMemo(() => {
    const list: { staff: Staff; record: AttendanceRecord }[] = [];

    const filteredStaff = staffList.filter(staff => {
      const nameMatch = staff.name.toLowerCase().includes(staffNameFilter.toLowerCase());
      const departmentMatch = staffDepartmentFilter === 'all' || staff.department === staffDepartmentFilter;
      return nameMatch && departmentMatch;
    });

    filteredStaff.forEach(staff => {
      if (staff.attendanceRecords) {
        staff.attendanceRecords.forEach(record => {
          let dateMatch = false;
          if (date?.from) {
            const recordDate = startOfDay(new Date(record.date));
            dateMatch = isWithinInterval(recordDate, {
              start: startOfDay(date.from),
              end: startOfDay(date.to ?? date.from),
            });
          } else {
            dateMatch = true;
          }

          if (dateMatch) {
            list.push({ staff, record });
          }
        });
      }
    });

    list.sort((a, b) => {
      const dateComparison = new Date(b.record.date).getTime() - new Date(a.record.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.staff.name.localeCompare(b.staff.name);
    });

    return list;
  }, [staffList, staffNameFilter, staffDepartmentFilter, date]);

  const studentMasterList = useMemo(() => {
      if (!studentInitialized) return [];
      return studentList.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(studentNameFilter.toLowerCase());
        const classMatch = studentClassFilter === 'all' || student.className === studentClassFilter;
        return nameMatch && classMatch;
      });
  }, [studentList, studentNameFilter, studentClassFilter, studentInitialized]);

  const studentAttendanceList = useMemo(() => {
    const list: { student: Student; record: AttendanceRecord }[] = [];

    const filteredStudents = studentList.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(studentNameFilter.toLowerCase());
      const classMatch = studentClassFilter === 'all' || student.className === studentClassFilter;
      return nameMatch && classMatch;
    });

    filteredStudents.forEach(student => {
      if (student.attendanceRecords) {
        student.attendanceRecords.forEach(record => {
          let dateMatch = false;
          if (date?.from) {
            const recordDate = startOfDay(new Date(record.date));
            dateMatch = isWithinInterval(recordDate, {
              start: startOfDay(date.from),
              end: startOfDay(date.to ?? date.from),
            });
          } else {
            dateMatch = true;
          }

          if (dateMatch) {
            list.push({ student, record });
          }
        });
      }
    });
    
    list.sort((a, b) => {
        const dateComparison = new Date(b.record.date).getTime() - new Date(a.record.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.student.name.localeCompare(b.student.name);
    });

    return list;
  }, [studentList, studentNameFilter, studentClassFilter, date]);


  const handleGenerateCsv = () => {
    if (!date?.from) return;
    const dateStr = `${format(date.from, 'yyyy-MM-dd')}_to_${format(date.to ?? date.from, 'yyyy-MM-dd')}`;
    let csvData;
    let fileName;
    
    if (activeTab === 'staff') {
      const headers = ['Staff ID', 'Name', 'Email', 'Mobile', 'Department', 'Role', 'Date', 'In-Time', 'Out-Time', 'Total Hours Worked'];
      const rows = staffAttendanceList.map(({ staff, record }) => [
            staff.id, staff.name, staff.email, staff.mobile, staff.department, staff.role,
            record.date ? format(new Date(record.date), 'yyyy-MM-dd') : 'N/A',
            record.inTime ?? 'N/A', record.outTime ?? 'N/A', record.totalHours ?? 'N/A'
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
      fileName = `staff_attendance_${dateStr}.csv`;
    } else { // activeTab === 'student' and studentView === 'report'
      const headers = ['Student ID', 'Name', 'Email', 'Class', 'Roll Number', 'Gender', 'DOB', 'Religion', 'Father Name', "Mother's Name", 'Parent Mobile', 'Parent WhatsApp', 'Date', 'Arrival Time', 'Departure Time', 'Total Hours'];
      const rows = studentAttendanceList.map(({ student, record }) => [
            student.id, student.name, student.email, student.className, student.rollNumber, student.gender, student.dob,
            student.religion, student.fatherName, student.motherName, student.parentMobile, student.parentWhatsapp,
            record.date ? format(new Date(record.date), 'yyyy-MM-dd') : 'N/A',
            record.inTime ?? 'N/A', record.outTime ?? 'N/A', record.totalHours ?? 'N/A'
      ].join(','));
      csvData = [headers.join(','), ...rows].join('\n');
      fileName = `student_attendance_${dateStr}.csv`;
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
  
  const handlePrint = () => {
    window.print();
  };

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceRecords'>) => {
    addStaff(newStaff);
    toast({
      title: 'Staff Added',
      description: `${newStaff.name} has been successfully added.`,
    });
  };
  
  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'attendanceRecords'>) => {
    addStudent(newStudent);
    toast({
      title: 'Student Added',
      description: `${newStudent.name} has been successfully added.`,
    });
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsEditStudentModalOpen(true);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    updateStudent(updatedStudent);
  };

  const handleDeleteStudent = (studentId: string) => {
    deleteStudent(studentId);
    toast({
      variant: 'destructive',
      title: 'Student Deleted',
      description: 'The student has been successfully removed.',
    });
  };
  
  const clearFilters = () => {
      if (activeTab === 'staff') {
          setStaffNameFilter('');
          setStaffDepartmentFilter('all');
      } else {
          setStudentNameFilter('');
          setStudentClassFilter('all');
      }
      setDate({ from: new Date(), to: new Date() });
  }
  
  const renderDateRangeTitle = () => {
      if (!date?.from) return "No date selected";
      if (!date.to || format(date.from, 'yyyy-MM-dd') === format(date.to, 'yyyy-MM-dd')) {
        return format(date.from, 'PPP');
      }
      return `${format(date.from, 'PPP')} to ${format(date.to, 'PPP')}`;
  }

  const renderStaffTable = () => (
    <Card id="report-table">
      <CardHeader>
        <CardTitle>Staff Attendance - {renderDateRangeTitle()}</CardTitle>
        <CardDescription>An overview of staff attendance for the selected date range.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>In-Time</TableHead>
              <TableHead>Out-Time</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead className="text-right print-hide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!staffInitialized ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading staff data...</TableCell></TableRow>
            ) : staffAttendanceList.length > 0 ? (
              staffAttendanceList.map(({ staff, record }) => (
                  <TableRow key={`${staff.id}-${record.date}`}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.department}</TableCell>
                    <TableCell>{record.date ? format(new Date(record.date), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{record.inTime ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">{record.inTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                    <TableCell>{record.outTime ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{record.outTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                    <TableCell>{record.totalHours ? <Badge variant="outline">{record.totalHours}</Badge> : <Badge variant="secondary">--</Badge>}</TableCell>
                    <TableCell className="text-right print-hide">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>View Details</DropdownMenuItem><DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center h-24">No attendance records match the current filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderStudentManagementContent = () => (
     <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Class Strength</CardTitle>
                <CardDescription>A quick overview of student distribution. Click a class to filter.</CardDescription>
            </CardHeader>
            <CardContent>
                {studentInitialized && Object.keys(classStrength).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Object.entries(classStrength).map(([className, count]) => (
                            <button
                                key={className}
                                onClick={() => setStudentClassFilter(className)}
                                className={cn(
                                    "p-4 bg-card rounded-lg text-left transition-all border hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
                                    studentClassFilter === className && "ring-2 ring-primary"
                                )}
                            >
                                <p className="text-sm font-medium text-muted-foreground">Class {className}</p>
                                <p className="text-2xl font-bold">{count} <span className="text-sm font-medium text-muted-foreground">Students</span></p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {studentInitialized ? 'Add students to see class strength.' : 'Loading student data...'}
                    </div>
                )}
            </CardContent>
        </Card>
        
        <Tabs value={studentView} onValueChange={setStudentView}>
            <div className="flex justify-between items-center print-hide">
                <TabsList>
                    <TabsTrigger value="list">Student Master List</TabsTrigger>
                    <TabsTrigger value="report">Attendance Report</TabsTrigger>
                </TabsList>
                <Button onClick={() => setIsAddStudentModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Student</Button>
            </div>
            
            <TabsContent value="list">
                <Card>
                    <CardHeader>
                        <CardTitle>Student Master List</CardTitle>
                        <CardDescription>View, edit, and manage all students in the system. This view is not affected by the date filter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Roll No.</TableHead>
                                    <TableHead>Father's Name</TableHead>
                                    <TableHead>Parent's Mobile</TableHead>
                                    <TableHead className="text-right print-hide">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!studentInitialized ? (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading student data...</TableCell></TableRow>
                                ) : studentMasterList.length > 0 ? (
                                    studentMasterList.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.className}</TableCell>
                                        <TableCell>{student.rollNumber}</TableCell>
                                        <TableCell>{student.fatherName}</TableCell>
                                        <TableCell>{student.parentMobile}</TableCell>
                                        <TableCell className="text-right print-hide">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditStudent(student)}>Edit</DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/90 focus:text-destructive-foreground">
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the student and all associated attendance data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="text-center h-24">No students match the current filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="report" id="report-table">
                <Card>
                    <CardHeader>
                        <CardTitle>Student Attendance - {renderDateRangeTitle()}</CardTitle>
                        <CardDescription>An overview of student attendance for the selected date range.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Roll No.</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Arrival Time</TableHead>
                            <TableHead>Departure Time</TableHead>
                            <TableHead>Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!studentInitialized ? (
                                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading student data...</TableCell></TableRow>
                            ) : studentAttendanceList.length > 0 ? (
                            studentAttendanceList.map(({ student, record }) => (
                                <TableRow key={`${student.id}-${record.date}`}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.className}</TableCell>
                                    <TableCell>{student.rollNumber}</TableCell>
                                    <TableCell>{record.date ? format(new Date(record.date), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell>{record.inTime ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">{record.inTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                                    <TableCell>{record.outTime ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{record.outTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                                    <TableCell>{record.totalHours ? <Badge variant="outline">{record.totalHours}</Badge> : <Badge variant="secondary">--</Badge>}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={7} className="text-center h-24">No attendance records match the current filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
     </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print-hide">
        <div>
          <h1 className="text-3xl font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your staff, students and view attendance.</p>
        </div>
        <div className="flex gap-2">
           <Button 
                variant="outline"
                onClick={handleGenerateCsv}
                disabled={!date?.from || (activeTab === 'staff' && staffAttendanceList.length === 0) || (activeTab === 'student' && (studentView !== 'report' || studentAttendanceList.length === 0))}
            >
            <FileDown className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={activeTab === 'student' && studentView !== 'report'}
          >
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
          <Button asChild><Link href="/client/salary"><Banknote className="mr-2 h-4 w-4" />Manage Salaries</Link></Button>
          <Button asChild><Link href="/client/attendance-kiosk"><Video className="mr-2 h-4 w-4" />Open Attendance Kiosk</Link></Button>
        </div>
      </div>
      
      <Card className="print-hide">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeTab === 'staff' ? (
            <>
              <Input placeholder="Filter by staff name..." value={staffNameFilter} onChange={(e) => setStaffNameFilter(e.target.value)} />
              <Select value={staffDepartmentFilter} onValueChange={setStaffDepartmentFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by department..." /></SelectTrigger>
                <SelectContent>
                  {staffDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Input placeholder="Filter by student name..." value={studentNameFilter} onChange={(e) => setStudentNameFilter(e.target.value)} />
              <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by class..." /></SelectTrigger>
                <SelectContent>
                  {studentClasses.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : c}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
          <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        (activeTab === 'student' && studentView !== 'report') && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={activeTab === 'student' && studentView !== 'report'}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={clearFilters}><X className="mr-2"/> Clear Filters</Button>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-end print-hide">
          <TabsList>
            <TabsTrigger value="staff"><Users className="mr-2" /> Staff Management</TabsTrigger>
            <TabsTrigger value="student"><User className="mr-2" /> Student Management</TabsTrigger>
          </TabsList>
          {activeTab === 'staff' && (<Button onClick={() => setIsAddStaffModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Staff</Button>)}
        </div>

        <TabsContent value="staff">{renderStaffTable()}</TabsContent>
        <TabsContent value="student">{renderStudentManagementContent()}</TabsContent>
      </Tabs>

      <AddStaffModal isOpen={isAddStaffModalOpen} onOpenChange={setIsAddStaffModalOpen} onStaffAdded={handleAddStaff} />
      <AddStudentModal isOpen={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen} onStudentAdded={handleAddStudent} />
      <EditStudentModal 
        isOpen={isEditStudentModalOpen}
        onOpenChange={setIsEditStudentModalOpen}
        student={studentToEdit}
        onStudentUpdated={handleUpdateStudent}
      />
    </div>
  );
}
