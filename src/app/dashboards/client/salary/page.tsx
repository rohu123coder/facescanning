'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cog, FileText, Loader2 } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useAttendanceStore } from '@/hooks/use-attendance-store';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { getDaysInMonth, getDay, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalaryRulesModal } from '@/components/salary-rules-modal';
import { PayslipModal } from '@/components/payslip-modal';
import { type Staff } from '@/lib/data';

export type PayslipData = {
  staff: Staff;
  month: string;
  year: string;
  grossSalary: number; // monthly rate
  earnedSalary: number;
  totalWorkingDays: number;
  daysPresent: number;
  lopDays: number;
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    total: number;
  };
  deductions: {
    lop: number;
    standard: number;
    total: number;
  };
  netSalary: number;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function SalaryPage() {
  const { staff } = useStaffStore();
  const { attendance } = useAttendanceStore();
  const { rules } = useSalaryRulesStore();

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);

  const handleGenerateSlips = () => {
    setIsLoading(true);
    setPayslips([]);

    const monthIndex = monthNames.indexOf(selectedMonth);
    const date = new Date(parseInt(selectedYear), monthIndex, 1);
    const totalDaysInMonth = getDaysInMonth(date);
    
    let totalWorkingDays = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(parseInt(selectedYear), monthIndex, day);
        const dayOfWeek = getDay(currentDate); // 0=Sun, 1=Mon, ..., 6=Sat
        if (rules.workingDays.includes(dayOfWeek.toString())) {
            totalWorkingDays++;
        }
    }
    
    const generatedPayslips = staff.map(employee => {
        const monthStartDate = format(new Date(parseInt(selectedYear), monthIndex, 1), 'yyyy-MM-dd');
        const monthEndDate = format(new Date(parseInt(selectedYear), monthIndex, totalDaysInMonth), 'yyyy-MM-dd');

        const daysPresent = attendance.filter(record => 
            record.staffId === employee.id &&
            record.date >= monthStartDate &&
            record.date <= monthEndDate &&
            record.inTime !== null
        ).length;
        
        const grossSalaryRate = employee.salary;
        const perDayRate = totalWorkingDays > 0 ? grossSalaryRate / totalWorkingDays : 0;
        const lopDays = Math.max(0, totalWorkingDays - daysPresent);
        const lopDeduction = perDayRate * lopDays;
        
        const earnedGrossSalary = grossSalaryRate - lopDeduction;

        const basicPay = earnedGrossSalary * (rules.basicSalaryPercentage / 100);
        const hra = earnedGrossSalary * (rules.hraPercentage / 100);
        const specialAllowance = earnedGrossSalary - basicPay - hra;

        const totalEarnings = earnedGrossSalary;

        const standardDeduction = earnedGrossSalary * (rules.standardDeductionPercentage / 100);
        const totalDeductions = standardDeduction;

        const netSalary = totalEarnings - totalDeductions;

        return {
          staff: employee,
          month: selectedMonth,
          year: selectedYear,
          grossSalary: grossSalaryRate,
          earnedSalary: earnedGrossSalary,
          totalWorkingDays,
          daysPresent,
          lopDays,
          earnings: {
              basic: parseFloat(basicPay.toFixed(2)),
              hra: parseFloat(hra.toFixed(2)),
              specialAllowance: parseFloat(specialAllowance.toFixed(2)),
              total: parseFloat(totalEarnings.toFixed(2)),
          },
          deductions: {
              lop: parseFloat(lopDeduction.toFixed(2)),
              standard: parseFloat(standardDeduction.toFixed(2)),
              total: parseFloat(totalDeductions.toFixed(2)),
          },
          netSalary: parseFloat(netSalary.toFixed(2)),
        };
    });
    
    setTimeout(() => {
        setPayslips(generatedPayslips);
        setIsLoading(false);
    }, 500);
  };

  const handleViewPayslip = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    setIsPayslipModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-headline">Salary Automation</h1>
              <p className="text-muted-foreground">Automate salary calculation and generate slips based on attendance.</p>
            </div>
            <Button variant="outline" onClick={() => setIsRulesModalOpen(true)}>
                <Cog className="mr-2"/>
                Salary Rules
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Generate Payslips</CardTitle>
                <CardDescription>Select a month and year to generate payslips for all active employees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateSlips} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Generate Slips'}
                    </Button>
                </div>

                <div className="border rounded-lg mt-4">
                     <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead className="text-right">Gross Salary</TableHead>
                            <TableHead className="text-right">Working Days</TableHead>
                            <TableHead className="text-right">Present Days</TableHead>
                            <TableHead className="text-right">Deductions</TableHead>
                            <TableHead className="text-right">Net Salary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        <p className="mt-2 text-muted-foreground">Calculating salaries...</p>
                                    </TableCell>
                                </TableRow>
                            ) : payslips.length > 0 ? (
                                payslips.map((p) => (
                                    <TableRow key={p.staff.id}>
                                    <TableCell className="font-medium">{p.staff.name}</TableCell>
                                    <TableCell>{p.staff.role}</TableCell>
                                    <TableCell className="text-right">{p.grossSalary.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">{p.totalWorkingDays}</TableCell>
                                    <TableCell className="text-right">{p.daysPresent}</TableCell>
                                    <TableCell className="text-right text-destructive">{p.deductions.total.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right font-semibold">{p.netSalary.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewPayslip(p)}>
                                            <FileText className="mr-2" /> View Payslip
                                        </Button>
                                    </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                    No salary slips generated. Please select a period and click "Generate Slips".
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
      <SalaryRulesModal isOpen={isRulesModalOpen} onOpenChange={setIsRulesModalOpen} />
      <PayslipModal isOpen={isPayslipModalOpen} onOpenChange={setIsPayslipModalOpen} payslipData={selectedPayslip} />
    </>
  );
}
