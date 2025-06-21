import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { staff } from '@/lib/data';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Staff List</CardTitle>
          <CardDescription>A comprehensive list of all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>
                     <Badge variant="outline">{employee.department}</Badge>
                  </TableCell>
                  <TableCell>{employee.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
