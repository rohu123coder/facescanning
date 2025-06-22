'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileDown, Video, User, Users, Printer, Calendar as CalendarIcon, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type Staff, type Student } from '@/lib/data';
import { generateAttendanceReportCsv, generateStudentAttendanceReportCsv } from '@/lib/actions';
import { AddStaffModal } from '@/components/add-staff-modal';
import { AddStudentModal } from '@/components/add-student-modal';
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

export default function ClientDashboard() {
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  // Filter states
  const [staffNameFilter, setStaffNameFilter] = useState('');
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState('all');
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  
  const { staffList, addStaff, isInitialized: staffInitialized } = useStaffStore();
  const { studentList, addStudent, isInitialized: studentInitialized } = useStudentStore();
  
  // Memoized lists for filter options
  const staffDepartments = useMemo(() => {
    if (!staffInitialized) return [];
    return ['all', ...Array.from(new Set(staffList.map(s => s.department)))];
  }, [staffList, staffInitialized]);

  const studentClasses = useMemo(() => {
    if (!studentInitialized) return [];
    return ['all', ...Array.from(new Set(studentList.map(s => s.className)))];
  }, [studentList, studentInitialized]);

  // Memoized filtered lists for display
  const filteredStaffList = useMemo(() => {
    return staffList.filter(staff => {
      const nameMatch = staff.name.toLowerCase().includes(staffNameFilter.toLowerCase());
      const departmentMatch = staffDepartmentFilter === 'all' || staff.department === staffDepartmentFilter;
      
      let dateMatch = true;
      if (date?.from) {
        const attendanceDate = staff.attendanceStatus?.date ? new Date(staff.attendanceStatus.date) : null;
        if (!attendanceDate) {
          dateMatch = false;
        } else {
          dateMatch = isWithinInterval(attendanceDate, {
            start: startOfDay(date.from),
            end: startOfDay(date.to ?? date.from)
          });
        }
      }
      return nameMatch && departmentMatch && dateMatch;
    });
  }, [staffList, staffNameFilter, staffDepartmentFilter, date]);
  
  const filteredStudentList = useMemo(() => {
    return studentList.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(studentNameFilter.toLowerCase());
      const classMatch = studentClassFilter === 'all' || student.className === studentClassFilter;

      let dateMatch = true;
      if (date?.from) {
        const attendanceDate = student.attendanceStatus?.date ? new Date(student.attendanceStatus.date) : null;
        if (!attendanceDate) {
          dateMatch = false;
        } else {
           dateMatch = isWithinInterval(attendanceDate, {
            start: startOfDay(date.from),
            end: startOfDay(date.to ?? date.from)
          });
        }
      }
      return nameMatch && classMatch && dateMatch;
    });
  }, [studentList, studentNameFilter, studentClassFilter, date]);


  const handleGenerateCsv = async () => {
    if (!date?.from) return;
    const dateStr = `${format(date.from, 'yyyy-MM-dd')}_to_${format(date.to ?? date.from, 'yyyy-MM-dd')}`;
    let csvData;
    let fileName;
    if (activeTab === 'staff') {
      csvData = await generateAttendanceReportCsv(filteredStaffList, dateStr);
      fileName = `staff_attendance_${dateStr}.csv`;
    } else {
      csvData = await generateStudentAttendanceReportCsv(filteredStudentList, dateStr);
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

  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceStatus'>) => {
    addStaff(newStaff);
  };
  
  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'attendanceStatus'>) => {
    addStudent(newStudent);
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
            ) : filteredStaffList.length > 0 ? (
              filteredStaffList.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.attendanceStatus?.date ? format(new Date(employee.attendanceStatus.date), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>{employee.attendanceStatus?.inTime ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">{employee.attendanceStatus.inTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                    <TableCell>{employee.attendanceStatus?.outTime ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{employee.attendanceStatus.outTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                    <TableCell>{employee.attendanceStatus?.totalHours ? <Badge variant="outline">{employee.attendanceStatus.totalHours}</Badge> : <Badge variant="secondary">--</Badge>}</TableCell>
                    <TableCell className="text-right print-hide">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>View Details</DropdownMenuItem><DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center h-24">No staff members match the current filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderStudentTable = () => (
     <Card id="report-table">
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
                ) : filteredStudentList.length > 0 ? (
                filteredStudentList.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.attendanceStatus?.date ? format(new Date(student.attendanceStatus.date), 'PPP') : 'N/A'}</TableCell>
                        <TableCell>{student.attendanceStatus?.inTime ? <Badge variant="default" className="bg-green-600 hover:bg-green-700">{student.attendanceStatus.inTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                        <TableCell>{student.attendanceStatus?.outTime ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{student.attendanceStatus.outTime}</Badge> : <Badge variant="secondary">Not Logged</Badge>}</TableCell>
                        <TableCell>{student.attendanceStatus?.totalHours ? <Badge variant="outline">{student.attendanceStatus.totalHours}</Badge> : <Badge variant="secondary">--</Badge>}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">No students match the current filters.</TableCell></TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print-hide">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your staff, students and view attendance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleGenerateCsv} disabled={!date?.from || (activeTab === 'staff' && filteredStaffList.length === 0) || (activeTab === 'student' && filteredStudentList.length === 0)}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
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
                    !date && "text-muted-foreground"
                    )}
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
          {activeTab === 'student' && (<Button onClick={() => setIsAddStudentModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Student</Button>)}
        </div>

        <TabsContent value="staff">{renderStaffTable()}</TabsContent>
        <TabsContent value="student">{renderStudentTable()}</TabsContent>
      </Tabs>

      <AddStaffModal isOpen={isAddStaffModalOpen} onOpenChange={setIsAddStaffModalOpen} onStaffAdded={handleAddStaff} />
      <AddStudentModal isOpen={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen} onStudentAdded={handleAddStudent} />
    </div>
  );
}
