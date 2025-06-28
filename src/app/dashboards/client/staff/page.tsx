
'use client';

import { useState } from 'react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { AddStaffModal } from '@/components/add-staff-modal';
import { EditStaffModal } from '@/components/edit-staff-modal';
import type { Staff } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceReport } from '@/components/attendance-report';

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
  const { staff, isInitialized } = useStaffStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  
  const handleEdit = (staffMember: Staff) => {
    setStaffToEdit(staffMember);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Staff Management</h1>
            <p className="text-muted-foreground">Manage your organization's staff members.</p>
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
            <TabsContent value="list">
                <Card>
                    <CardHeader>
                      <CardTitle>Staff List</CardTitle>
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
                                    </DropdownMenuContent>
                                    </DropdownMenu>
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
