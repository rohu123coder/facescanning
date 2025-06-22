'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { type Staff } from '@/lib/data';
import { format } from 'date-fns';

type SalaryData = {
  presentDays: number;
  leaveDays: number;
  earnedGross: number;
  basic: number;
  hra: number;
  deductions: number;
  netPay: number;
};

interface PayslipModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staff: Staff;
  salaryData: SalaryData;
  payPeriod: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
};


export function PayslipModal({ isOpen, onOpenChange, staff, salaryData, payPeriod }: PayslipModalProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
        title: 'Feature not available',
        description: 'PDF download functionality is a planned feature.',
    });
  };
  
  const handleEmail = () => {
    toast({
        title: 'Feature not available',
        description: `Emailing payslip to ${staff.name} is a planned feature.`,
    });
  }

  const specialAllowance = Math.max(0, salaryData.earnedGross - salaryData.basic - salaryData.hra);

  const earnings = [
    { description: 'Basic Salary', amount: salaryData.basic },
    { description: 'House Rent Allowance (HRA)', amount: salaryData.hra },
  ];

  if (specialAllowance > 0.01) { // Add only if it's a meaningful amount
    earnings.push({ description: 'Special Allowance', amount: specialAllowance });
  }

  const deductions = [
    { description: 'Standard Deductions', amount: salaryData.deductions },
  ];
  
  const totalEarnings = salaryData.earnedGross;
  const totalDeductions = salaryData.deductions;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div id="payslip-content">
            <CardHeader className="p-6">
                <DialogTitle className="text-3xl font-bold">Salary Slip</DialogTitle>
                <DialogDescription>
                For {staff.name} - {payPeriod}
                </DialogDescription>
            </CardHeader>
            <CardContent className="px-6">
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <p className="font-semibold">{staff.name}</p>
                        <p className="text-muted-foreground">Employee ID: {staff.id}</p>
                        <p className="text-muted-foreground">Department: {staff.department}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Karma Manager Inc.</p>
                        <p className="text-muted-foreground">Pay Date: {format(new Date(), 'dd MMM, yyyy')}</p>
                        <p className="text-muted-foreground">Present Days: {salaryData.presentDays}</p>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-2 text-lg">Earnings</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {earnings.map((item) => (
                                    <TableRow key={item.description}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 text-lg">Deductions</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deductions.map((item) => (
                                    <TableRow key={item.description}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-lg">
                        <p className="font-semibold">Total Earnings:</p>
                        <p className="font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                    </div>
                    <div className="text-lg text-right">
                        <p className="font-semibold">Total Deductions:</p>
                        <p className="font-bold text-destructive">{formatCurrency(totalDeductions)}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/50 p-6 rounded-b-lg mt-6">
                <div className="text-xl font-bold">
                    <span>Net Salary: </span>
                    <span className="text-primary">{formatCurrency(salaryData.netPay)}</span>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleEmail} variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Payslip
                    </Button>
                    <Button onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </CardFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
