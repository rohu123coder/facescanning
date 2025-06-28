// This file is repurposed for Student Management as part of a pivot to a school management system.
'use client';

import { useState } from 'react';
import { useStudentStore } from '@/hooks/use-student-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Check, X } from 'lucide-react';
import { AddStudentModal } from '@/components/add-student-modal';
import { EditStudentModal } from '@/components/edit-student-modal';
import type { Student } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAttendanceReport } from '@/components/student-attendance-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const getStatusBadge = (status: 'Active' | 'Inactive') => {
  switch (status) {
    case 'Active':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{status}</Badge>;
    case 'Inactive':
      return <Badge variant="secondary">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function StudentPage() {
  const { students, isInitialized } = useStudentStore();
  const { attendance, markAttendance } = useStudentAttendanceStore();
  const { toast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [classFilter, setClassFilter] = useState('All');
  
  const classNames = ['All', ...Array.from(new Set(students.map(s => s.className)))];

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsEditModalOpen(true);
  };
  
  const handleMarkAttendance = (student: Student) => {
    const result = markAttendance(student);
    toast({
      title: 'Attendance Marked',
      description: `${student.name} marked as ${result === 'in' ? 'Present (In)' : 'Present (Out)'} for ${format(new Date(), 'PP')}.`
    });
  };

  const isPresent = (studentId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return attendance.some(a => a.personId === studentId && a.date === today && a.inTime);
  };

  const filteredStudents = classFilter === 'All' ? students : students.filter(s => s.className === classFilter);

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Student Management</h1>
            <p className="text-muted-foreground">Manage students, classes, and attendance reports.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Student List</TabsTrigger>
                <TabsTrigger value="report">Attendance Report</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
                <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Student List</CardTitle>
                          <CardDescription>A list of all students in your organization.</CardDescription>
                        </div>
                         <Select value={classFilter} onValueChange={setClassFilter}>
                           <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by class" />
                           </SelectTrigger>
                           <SelectContent>
                              {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                           </SelectContent>
                         </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Roll No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Parent Mobile</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isInitialized ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                Loading students...
                                </TableCell>
                            </TableRow>
                            ) : filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.rollNumber}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.className}</TableCell>
                                <TableCell>{student.parentMobile}</TableCell>
                                <TableCell>{getStatusBadge(student.status)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant={isPresent(student.id) ? 'secondary' : 'outline'}
                                      onClick={() => handleMarkAttendance(student)}
                                    >
                                      {isPresent(student.id) ? <X className="mr-2" /> : <Check className="mr-2" />}
                                      {isPresent(student.id) ? 'Mark Out' : 'Mark In'}
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEdit(student)}>
                                          Edit
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                No students found. Get started by adding a new student.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="report">
                <StudentAttendanceReport />
            </TabsContent>
        </Tabs>
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
      <EditStudentModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        student={studentToEdit}
      />
    </>
  );
}
