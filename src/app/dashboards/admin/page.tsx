'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useToast } from '@/hooks/use-toast';
import { EditStaffModal } from '@/components/edit-staff-modal';
import { AddStaffModal } from '@/components/add-staff-modal';
import { type Staff } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const { staffList, updateStaff, deleteStaff, addStaff, isInitialized } = useStaffStore();
  const { toast } = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

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
  
  const handleAddStaff = (newStaff: Omit<Staff, 'id' | 'attendanceRecords'>) => {
    addStaff(newStaff);
    toast({
      title: 'Staff Added',
      description: `${newStaff.name} has been successfully added.`,
    });
  };

  const departments = useMemo(() => {
    if (!isInitialized) return [];
    return ['all', ...Array.from(new Set(staffList.map(s => s.department)))];
  }, [staffList, isInitialized]);

  const filteredStaffList = useMemo(() => {
    return staffList.filter(staff => {
      const nameMatch = staff.name.toLowerCase().includes(nameFilter.toLowerCase());
      const departmentMatch = departmentFilter === 'all' || staff.department === departmentFilter;
      return nameMatch && departmentMatch;
    });
  }, [staffList, nameFilter, departmentFilter]);

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Organization Staff List</CardTitle>
                <CardDescription>A comprehensive list of all employees. You can edit or delete staff records here.</CardDescription>
            </div>
            <Button onClick={() => setIsAddStaffModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />Add Staff
            </Button>
          </CardHeader>
           <CardContent className="border-t border-b p-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                  />
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Filter by department..." />
                      </SelectTrigger>
                      <SelectContent>
                          {departments.map(dept => <SelectItem key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</SelectItem>)}
                      </SelectContent>
                  </Select>
               </div>
          </CardContent>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isInitialized ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading staff data...
                    </TableCell>
                  </TableRow>
                ) : filteredStaffList.length > 0 ? (
                  filteredStaffList.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>Edit Details</DropdownMenuItem>
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
                    <TableCell colSpan={4} className="h-24 text-center">
                      No staff members found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <AddStaffModal 
        isOpen={isAddStaffModalOpen} 
        onOpenChange={setIsAddStaffModalOpen} 
        onStaffAdded={handleAddStaff} 
      />
      <EditStaffModal 
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        staff={staffToEdit}
        onStaffUpdated={handleUpdate}
      />
    </>
  );
}
