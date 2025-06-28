'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StaffPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Staff Management</h1>
        <p className="text-muted-foreground">Manage your employees, roles, and permissions.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <CardDescription>This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The staff management dashboard will be available here shortly.</p>
        </CardContent>
       </Card>
    </div>
  );
}
