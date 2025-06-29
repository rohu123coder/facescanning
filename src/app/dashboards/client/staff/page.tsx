
'use client';

import { useState } from 'react';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Users, UserCheck, Building } from 'lucide-react';
import { AddStaffModal } from '@/components/add-staff-modal';
import { EditStaffModal } from '@/components/edit-staff-modal';
import type { Staff } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceReport } from '@/components/attendance-report';
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
import { useToast } from '@/hooks/use-toast';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';


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

export default function StaffPage() {
  const { staff, isInitialized, deleteStaff } = useStaffStore();
  const { setAttendance } = useAttendanceStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  
  const handleEdit = (staffMember: Staff) => {
    setStaffToEdit(staffMember);
    setIsEditModalOpen(true);
  };

  const handleDelete = (staffMember: Staff) => {
    // First, remove all attendance records for this staff member
    setAttendance(prev => prev.filter(att => att.personId !== staffMember.id));
    // Then, delete the staff member themselves
    deleteStaff(staffMember.id);
    toast({
      title: "Staff Member Deleted",
      description: `${staffMember.name} and all associated attendance data have been removed.`,
    });
  };

  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'Active').length;
  const departments = new Set(staff.map(s => s.department)).size;

  const stats = [
    { title: 'Total Staff', value: totalStaff, icon: <Users className="text-muted-foreground" /> },
    { title: 'Active Staff', value: activeStaff, icon: <UserCheck className="text-muted-foreground" /> },
    { title: 'Departments', value: departments, icon: <Building className="text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Staff Dashboard</h1>
            <p className="text-muted-foreground">An overview and management of your organization's staff.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Staff List</TabsTrigger>
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
                      <CardTitle>All Staff</CardTitle>
                      <CardDescription>A list of all staff in your organization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isInitialized ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                Loading staff...
                                </TableCell>
                            </TableRow>
                            ) : staff.length > 0 ? (
                            staff.map((staffMember) => (
                                <TableRow key={staffMember.id}>
                                <TableCell className="font-medium">{staffMember.name}</TableCell>
                                <TableCell>{staffMember.role}</TableCell>
                                <TableCell>{staffMember.department}</TableCell>
                                <TableCell>{staffMember.mobile}</TableCell>
                                <TableCell>{getStatusBadge(staffMember.status)}</TableCell>
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
                                            <DropdownMenuItem onClick={() => handleEdit(staffMember)}>
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
                                                This action cannot be undone. This will permanently delete {staffMember.name} and all their associated data.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => handleDelete(staffMember)}
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
                                No staff found. Get started by adding new staff.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="report">
                <AttendanceReport />
            </TabsContent>
        </Tabs>
      </div>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
      <EditStaffModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        staff={staffToEdit}
      />
    </>
  );
}
