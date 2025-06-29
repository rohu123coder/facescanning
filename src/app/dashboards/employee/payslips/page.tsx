
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandCoins } from 'lucide-react';

export default function MyPayslipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Payslips</h1>
        <p className="text-muted-foreground">View and download your salary slips.</p>
      </div>
       <Card className="flex flex-col items-center justify-center text-center p-12">
        <CardHeader>
            <div className="mx-auto bg-muted p-4 rounded-full mb-4">
                <HandCoins className="h-12 w-12 text-muted-foreground" />
            </div>
          <CardTitle className="font-headline text-2xl">Coming Soon</CardTitle>
          <CardDescription>
            This feature is under construction. Your payslips will be available here once the salary is processed by your admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be able to view detailed breakdowns of your salary and download PDF versions here.
          </p>
        </CardContent>
       </Card>
    </div>
  );
}
