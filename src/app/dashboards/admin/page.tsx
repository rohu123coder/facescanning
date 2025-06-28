'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Oversee all staff and manage system settings.</p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Welcome, Admin</CardTitle>
            <CardDescription>Staff management features have been temporarily disabled to resolve a system issue.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Further functionality will be restored shortly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
