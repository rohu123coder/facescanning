'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useToast } from '@/hooks/use-toast';
import { EditStaffModal } from '@/components/edit-staff-modal';
import { type Staff } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { staffList, updateStaff, deleteStaff, isInitialized } = useStaffStore();
  const { toast } = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

  const handleEdit = (staff: Staff) => {
    setStaffToEdit(staff);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (updatedStaff: Staff) => {
    updateStaff(updatedStaff);
    toast({
      title: 'Staff Updated',
      description: `Details for ${updatedStaff.name} have been updated.`,
    });
  };

  const handleDelete = (staffId: string) => {
    const staffMember = staffList.find(s => s.id === staffId);
    if (staffMember) {
        deleteStaff(staffId);
        toast({
        variant: 'destructive',
        title: 'Staff Deleted',
        description: `${staffMember.name} has been successfully removed.`,
        });
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Organization Staff List</CardTitle>
            <CardDescription>A comprehensive list of all employees. You can edit or delete staff records here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isInitialized ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading staff data...
                    </TableCell>
                  </TableRow>
                ) : staffList.length > 0 ? (
                  staffList.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>Edit</DropdownMenuItem>
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
                                    This action cannot be undone. This will permanently delete the staff member and all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(employee.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No staff members found. Add staff from the Client dashboard.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EditStaffModal 
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        staff={staffToEdit}
        onStaffUpdated={handleUpdate}
      />
    </>
  );
}
