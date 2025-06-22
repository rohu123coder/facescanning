'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { type Staff, type SalaryData } from '@/lib/data';

interface SalarySlipProps {
  staff: Staff | null;
  salaryData: SalaryData | null;
  payPeriod: string;
  payDate: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
};


export function SalarySlip({ staff, salaryData, payPeriod, payDate }: SalarySlipProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const slipElement = document.getElementById('salary-slip-content');
    if (slipElement && staff) {
        toast({
            title: 'Generating PDF...',
            description: 'Please wait while your payslip is being created.',
        });
        html2canvas(slipElement, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`payslip-${staff.name.replace(/\s/g, '_')}-${payPeriod}.pdf`);
        });
    }
  };

  if (!staff || !salaryData) {
    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Salary Slip</CardTitle>
                <CardDescription>Could not load salary data.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please ensure you are a registered staff member and have attendance records for the current period.</p>
            </CardContent>
        </Card>
    );
  }

  const earnings = [
    { description: 'Basic Salary', amount: salaryData.basic },
    { description: 'House Rent Allowance (HRA)', amount: salaryData.hra },
  ];

  if (salaryData.specialAllowance > 0.01) {
    earnings.push({ description: 'Special Allowance', amount: salaryData.specialAllowance });
  }

  const deductions = [
    { description: 'Standard Deductions', amount: salaryData.deductions },
  ];
  
  const totalEarnings = salaryData.earnedGross;
  const totalDeductions = salaryData.deductions;
  const netSalary = salaryData.netPay;

  return (
    <Card id="salary-slip-content" className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Salary Slip</CardTitle>
        <CardDescription>
          For {payPeriod}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
                <p className="font-semibold">{staff.name}</p>
                <p className="text-muted-foreground">Employee ID: {staff.id}</p>
                <p className="text-muted-foreground">Department: {staff.department}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold">Karma Manager Inc.</p>
                <p className="text-muted-foreground">Pay Date: {payDate}</p>
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
                            <TableHead className="text-right">Amount (INR)</TableHead>
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
                            <TableHead className="text-right">Amount (INR)</TableHead>
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
      <CardFooter className="flex justify-between items-center bg-muted/50 p-6 rounded-b-lg">
        <div className="text-xl font-bold">
            <span>Net Salary: </span>
            <span className="text-primary">{formatCurrency(netSalary)}</span>
        </div>
        <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
