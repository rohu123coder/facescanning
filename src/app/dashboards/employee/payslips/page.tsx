'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { HandCoins } from 'lucide-react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store.tsx';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { PayslipModal } from '@/components/payslip-modal';
import { type SalarySlipData } from '@/lib/data';

export default function MyPayslipsPage() {
  const { employee } = useEmployeeAuthStore();
  const { slips, isInitialized } = useSalarySlipsStore();
  
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipData | null>(null);

  if (!employee) {
    return <div>Loading...</div>;
  }

  const mySlips = slips.filter(s => s.staffId === employee.id);

  const handleViewPayslip = (slip: SalarySlipData) => {
    setSelectedSlip(slip);
    setIsPayslipModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Payslips</h1>
          <p className="text-muted-foreground">View and download your monthly salary slips.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <HandCoins />
              Salary Slip History
            </CardTitle>
            <CardDescription>A record of all your generated payslips.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Paid Days</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialized && mySlips.length > 0 ? (
                  mySlips.map(slip => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.month}, {slip.year}</TableCell>
                      <TableCell>₹{slip.netSalary.toFixed(2)}</TableCell>
                      <TableCell>{slip.paidDays} / {slip.workingDays}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewPayslip(slip)}>
                          View Payslip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {isInitialized ? "No payslips have been generated for you yet." : "Loading payslips..."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <PayslipModal 
        isOpen={isPayslipModalOpen} 
        onOpenChange={setIsPayslipModalOpen} 
        slipData={selectedSlip} 
      />
    </>
  );
}
