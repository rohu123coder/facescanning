'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EmployeeDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Employee Dashboard</h1>
        <p className="text-muted-foreground">Welcome! Here's your personal overview.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <CardDescription>This dashboard is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your personal dashboard with attendance summaries, upcoming tasks, and leave status will be available here shortly.</p>
        </CardContent>
       </Card>
    </div>
  );
}
