'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard. Let's get started.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>This is your main control panel. We can add features here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your application is ready. What would you like to build first?</p>
        </CardContent>
       </Card>
    </div>
  );
}
