'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function MyLeavesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Leaves</h1>
        <p className="text-muted-foreground">Apply for leave and check your leave balance.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileText />
            Feature In Development
          </CardTitle>
          <CardDescription>This feature is currently under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The ability to apply for leave and view your balance will be available here shortly. Thank you for your patience.</p>
        </CardContent>
       </Card>
    </div>
  );
}
