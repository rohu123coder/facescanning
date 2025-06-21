import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { clients } from '@/lib/data';

const getStatusBadge = (status: 'Active' | 'Inactive') => {
  switch (status) {
    case 'Active':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{status}</Badge>;
    case 'Inactive':
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPlanBadge = (plan: 'Basic' | 'Premium' | 'Enterprise') => {
    switch(plan) {
        case 'Basic':
            return <Badge variant="outline">{plan}</Badge>;
        case 'Premium':
            return <Badge variant="default">{plan}</Badge>;
        case 'Enterprise':
            return <Badge variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">{plan}</Badge>;
    }
}

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Super Admin Panel</h1>
        <p className="text-muted-foreground">Manage clients, payments, and onboarding.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
          <CardDescription>A list of all clients on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.id}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{getPlanBadge(client.plan)}</TableCell>
                  <TableCell>{client.staffCount}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(client.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
