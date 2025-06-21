'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';

const employee = {
    name: 'Diya Patel',
    id: 'KM-002',
    department: 'Design',
    payPeriod: 'July 2024',
    payDate: 'July 31, 2024',
};

const earnings = [
    { description: 'Basic Salary', amount: 43200 },
    { description: 'House Rent Allowance (HRA)', amount: 21600 },
    { description: 'Special Allowance', amount: 7200 },
];

const deductions = [
    { description: 'Provident Fund (PF)', amount: 1800 },
    { description: 'Professional Tax', amount: 200 },
    { description: 'Income Tax (TDS)', amount: 3500 },
];

const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
const netSalary = totalEarnings - totalDeductions;

export function SalarySlip() {
  const handleDownload = () => {
    // In a real app, this would trigger a PDF generation API
    alert('PDF download functionality is not implemented in this demo.');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Salary Slip</CardTitle>
        <CardDescription>
          For {employee.payPeriod}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
                <p className="font-semibold">{employee.name}</p>
                <p className="text-muted-foreground">Employee ID: {employee.id}</p>
                <p className="text-muted-foreground">Department: {employee.department}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold">Karma Manager Inc.</p>
                <p className="text-muted-foreground">Pay Date: {employee.payDate}</p>
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
                                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
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
                                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
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
                <p className="font-bold text-primary">{totalEarnings.toFixed(2)}</p>
            </div>
            <div className="text-lg text-right">
                <p className="font-semibold">Total Deductions:</p>
                <p className="font-bold text-destructive">{totalDeductions.toFixed(2)}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-6 rounded-b-lg">
        <div className="text-xl font-bold">
            <span>Net Salary: </span>
            <span className="text-primary">₹{netSalary.toFixed(2)}</span>
        </div>
        <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
