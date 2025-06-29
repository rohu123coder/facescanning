
'use client';

import { useState } from 'react';
import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, GraduationCap, UserCheck, School } from 'lucide-react';
import { AddStudentModal } from '@/components/add-student-modal';
import { EditStudentModal } from '@/components/edit-student-modal';
import type { Student } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAttendanceReport } from '@/components/student-attendance-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';


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

export default function StudentsPage() {
  const { students, isInitialized, deleteStudent } = useStudentStore();
  const { setAttendance } = useStudentAttendanceStore();
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
  
  const handleDelete = (student: Student) => {
    // First, remove all attendance records for this student
    setAttendance(prev => prev.filter(att => att.personId !== student.id));
    // Then, delete the student themselves
    deleteStudent(student.id);
    toast({
      title: "Student Deleted",
      description: `${student.name} and all associated attendance data have been removed.`,
    });
  };

  const filteredStudents = classFilter === 'All' ? students : students.filter(s => s.className === classFilter);

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const totalClasses = new Set(students.map(s => s.className)).size;

  const stats = [
    { title: 'Total Students', value: totalStudents, icon: <GraduationCap className="text-muted-foreground" /> },
    { title: 'Active Students', value: activeStudents, icon: <UserCheck className="text-muted-foreground" /> },
    { title: 'Total Classes', value: totalClasses, icon: <School className="text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Student Dashboard</h1>
            <p className="text-muted-foreground">An overview and management of students and classes.</p>
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
            <TabsContent value="list" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map(stat => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                {stat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>All Students</CardTitle>
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
                                <TableCell className="text-right">
                                    <AlertDialog>
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
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete {student.name} and all associated data.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => handleDelete(student)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
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
