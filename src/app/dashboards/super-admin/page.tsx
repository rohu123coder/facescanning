'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { type Client } from '@/lib/data';
import { AddClientModal } from '@/components/add-client-modal';
import { EditClientModal } from '@/components/edit-client-modal';
import { useClientStore } from '@/hooks/use-client-store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const { clients, addClient, updateClient, isInitialized } = useClientStore();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsEditClientModalOpen(true);
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage clients, payments, and onboarding.</p>
        </div>
        <Button onClick={() => setIsAddClientModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>A list of all clients on the platform. The password is the client's mobile number.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Organization Name</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile (Password)</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isInitialized ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">Loading clients...</TableCell>
                </TableRow>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.id}</TableCell>
                    <TableCell>{client.organizationName}</TableCell>
                    <TableCell>{client.contactName}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.mobile}</TableCell>
                    <TableCell>{getPlanBadge(client.plan)}</TableCell>
                    <TableCell>{client.staffCount}</TableCell>
                     <TableCell>
                      {client.isSetupComplete ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                Edit Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">No clients found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onOpenChange={setIsAddClientModalOpen}
        onClientAdded={addClient}
      />
      <EditClientModal
        isOpen={isEditClientModalOpen}
        onOpenChange={setIsEditClientModalOpen}
        client={clientToEdit}
        onClientUpdated={updateClient}
      />
    </div>
    </>
  );
}
