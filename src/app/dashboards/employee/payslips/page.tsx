
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { HandCoins } from 'lucide-react';
import { PayslipModal } from '@/components/payslip-modal';
import type { SalarySlipData } from '@/lib/data';

export default function MyPayslipsPage() {
  const { currentEmployeeId } = useEmployeeAuthStore();
  const { slips, isInitialized } = useSalarySlipsStore();
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipData | null>(null);

  const mySlips = useMemo(() => {
      if (!isInitialized || !currentEmployeeId) return [];
      return slips
        .filter(s => s.staffId === currentEmployeeId)
        .sort((a,b) => new Date(`${b.month} 1, ${b.year}`).getTime() - new Date(`${a.month} 1, ${a.year}`).getTime());
  }, [slips, currentEmployeeId, isInitialized]);

  const viewPayslip = (slip: SalarySlipData) => {
    setSelectedSlip(slip);
    setIsPayslipModalOpen(true);
  };

  return (
    <>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Payslips</h1>
        <p className="text-muted-foreground">View and download your salary slips.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HandCoins /> Payslip History</CardTitle>
          <CardDescription>A log of all your generated salary slips.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialized && mySlips.length > 0 ? (
                mySlips.map(slip => (
                  <TableRow key={slip.id}>
                    <TableCell>{slip.month}</TableCell>
                    <TableCell>{slip.year}</TableCell>
                    <TableCell className="font-semibold">₹{slip.netSalary.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => viewPayslip(slip)}>View Payslip</Button>
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
    <PayslipModal isOpen={isPayslipModalOpen} onOpenChange={setIsPayslipModalOpen} slipData={selectedSlip} />
    </>
  );
}
