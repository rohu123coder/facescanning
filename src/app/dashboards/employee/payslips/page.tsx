'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandCoins } from 'lucide-react';

export default function MyPayslipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Payslips</h1>
        <p className="text-muted-foreground">View and download your monthly salary slips.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <HandCoins />
            Feature In Development
          </CardTitle>
          <CardDescription>This feature is currently under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The ability to view and download your payslips will be available here shortly. Thank you for your patience.</p>
        </CardContent>
       </Card>
    </div>
  );
}
