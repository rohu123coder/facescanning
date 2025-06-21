'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { clients as initialClients, type Client } from '@/lib/data';
import { AddClientModal } from '@/components/add-client-modal';

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
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const handleClientAdded = (newClient: Omit<Client, 'id' | 'status' | 'staffCount'>) => {
    const newIdNumber = Math.max(0, ...clients.map(c => parseInt(c.id.split('-')[1], 10))) + 1;
    const newId = `C-${String(newIdNumber).padStart(3, '0')}`;
    const clientToAdd: Client = {
      ...newClient,
      id: newId,
      status: 'Active',
      staffCount: 0,
    };
    setClients(prev => [...prev, clientToAdd]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Super Admin Panel</h1>
          <p className="text-muted-foreground">Manage clients, payments, and onboarding.</p>
        </div>
        <Button onClick={() => setIsAddClientModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
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
                <TableHead>Email</TableHead>
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
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{getPlanBadge(client.plan)}</TableCell>
                  <TableCell>{client.staffCount}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(client.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onOpenChange={setIsAddClientModalOpen}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
