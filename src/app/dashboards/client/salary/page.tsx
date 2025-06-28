'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SalaryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Salary Automation</h1>
        <p className="text-muted-foreground">Automate salary calculation and generate slips.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <CardDescription>This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The salary automation dashboard will be available here shortly.</p>
        </CardContent>
       </Card>
    </div>
  );
}
