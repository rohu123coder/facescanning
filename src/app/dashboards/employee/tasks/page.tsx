'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
        <p className="text-muted-foreground">View and manage your assigned tasks.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CheckSquare />
            Feature In Development
          </CardTitle>
          <CardDescription>This feature is currently under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The ability to view and manage your tasks will be available here shortly. Thank you for your patience.</p>
        </CardContent>
       </Card>
    </div>
  );
}
