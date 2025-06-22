'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, CalendarCheck, Clock, Settings, MoreHorizontal, Mail, FileDown } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { endOfMonth, format, getMonth, getYear, isWithinInterval, startOfMonth } from 'date-fns';
import { PayslipModal } from '@/components/payslip-modal';
import { type Staff } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type SalaryData = {
  presentDays: number;
  leaveDays: number;
  basic: number;
  hra: number;
  deductions: number;
  netPay: number;
};

export default function SalaryManagementPage() {
  const { staffList, isInitialized } = useStaffStore();
  const { toast } = useToast();
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ staff: Staff, salaryData: SalaryData } | null>(null);

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const totalDaysInMonth = parseInt(format(monthEnd, 'd'), 10);

  const salaryData = useMemo(() => {
    if (!isInitialized) return [];

    return staffList.map(staff => {
      const presentDays = staff.attendanceRecords?.filter(rec => {
        const recDate = new Date(rec.date);
        return isWithinInterval(recDate, { start: monthStart, end: monthEnd });
      }).length ?? 0;

      const leaveDays = totalDaysInMonth - presentDays;
      
      // Simulated salary calculation
      const grossSalary = staff.salary;
      const basic = grossSalary * 0.5;
      const hra = grossSalary * 0.3;
      const deductions = grossSalary * 0.1; // (PF, ESI, etc.)
      const netPay = basic + hra - deductions;

      return {
        staff,
        salary: {
          presentDays,
          leaveDays,
          basic,
          hra,
          deductions,
          netPay,
        }
      };
    });
  }, [staffList, isInitialized, monthStart, monthEnd, totalDaysInMonth]);

  const summaryStats = useMemo(() => {
    const totalSalary = salaryData.reduce((acc, curr) => acc + curr.salary.netPay, 0);
    return {
      totalProcessed: totalSalary,
      pendingApprovals: 0, // Placeholder
    };
  }, [salaryData]);

  const handleGeneratePayslip = (staff: Staff, salaryData: SalaryData) => {
    setSelectedStaff({ staff, salaryData });
    setIsPayslipModalOpen(true);
  };
  
  const handleSimulatedAction = (title: string, description: string) => {
      toast({
          title,
          description,
      });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Salary Management</h1>
        <p className="text-muted-foreground">Automate payroll, manage salaries, and generate payslips.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary Processed</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalProcessed)}</div>
            <p className="text-xs text-muted-foreground">For {format(currentMonth, 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting your confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month-End Summary</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffList.length} Employees</div>
            <p className="text-xs text-muted-foreground">Payroll for {totalDaysInMonth} days</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-2">
                 <Button size="sm" onClick={() => handleSimulatedAction('Feature not available', 'The salary rules setup wizard is a planned feature.')}>Salary Rules Setup</Button>
                 <Button size="sm" variant="secondary" onClick={() => handleSimulatedAction('Payroll processing simulated', 'Payroll for all employees has been queued for processing.')}>Run Payroll for {format(currentMonth, 'MMMM')}</Button>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee-wise Salary for {format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <CardDescription>Auto-calculated based on attendance data and salary rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead className="text-center">Present Days</TableHead>
                <TableHead className="text-center">Leave/Absent</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">HRA</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isInitialized ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading salary data...
                  </TableCell>
                </TableRow>
              ) : salaryData.length > 0 ? (
                salaryData.map(({ staff, salary }) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell className="text-center"><Badge variant="default" className="bg-green-600">{salary.presentDays}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="destructive">{salary.leaveDays}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(salary.basic)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(salary.hra)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(salary.deductions)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatCurrency(salary.netPay)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleGeneratePayslip(staff, salary)}>
                             <FileDown className="mr-2 h-4 w-4" />
                             Generate Payslip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSimulatedAction('Feature not available', `Emailing payslip to ${staff.name} is a planned feature.`)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Email Payslip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedStaff && (
         <PayslipModal 
            isOpen={isPayslipModalOpen}
            onOpenChange={setIsPayslipModalOpen}
            staff={selectedStaff.staff}
            salaryData={selectedStaff.salaryData}
            payPeriod={format(currentMonth, 'MMMM yyyy')}
         />
      )}
    </div>
  );
}
