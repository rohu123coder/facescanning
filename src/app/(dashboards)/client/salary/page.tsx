'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, CalendarCheck, Clock, Settings, MoreHorizontal, Mail, FileDown } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { endOfMonth, format, isWithinInterval, startOfMonth } from 'date-fns';
import { PayslipModal } from '@/components/payslip-modal';
import { type Staff, type SalaryData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { SalaryRulesModal } from '@/components/salary-rules-modal';

export default function SalaryManagementPage() {
  const { staffList, isInitialized: isStaffInitialized } = useStaffStore();
  const { rules, isInitialized: areRulesInitialized } = useSalaryRulesStore();
  const { toast } = useToast();
  
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ staff: Staff, salaryData: SalaryData } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const { monthStart, monthEnd, totalDaysInMonth, currentMonthFormatted, currentMonthShortFormatted } = useMemo(() => {
    if (!currentDate) {
      return { monthStart: null, monthEnd: null, totalDaysInMonth: 0, currentMonthFormatted: 'Loading...', currentMonthShortFormatted: '...' };
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const totalDays = parseInt(format(end, 'd'), 10);
    return { 
        monthStart: start, 
        monthEnd: end, 
        totalDaysInMonth: totalDays,
        currentMonthFormatted: format(currentDate, 'MMMM yyyy'),
        currentMonthShortFormatted: format(currentDate, 'MMMM')
    };
  }, [currentDate]);

  const salaryData = useMemo(() => {
    if (!isStaffInitialized || !areRulesInitialized || !monthStart || !monthEnd || totalDaysInMonth === 0) return [];

    return staffList.map(staff => {
      const presentDays = staff.attendanceRecords?.filter(rec => {
        const recDate = new Date(rec.date);
        return isWithinInterval(recDate, { start: monthStart, end: monthEnd });
      }).length ?? 0;

      const leaveDays = totalDaysInMonth - presentDays;
      
      const monthlyGrossSalary = staff.salary;
      const earnedGross = presentDays > 0 ? (monthlyGrossSalary / totalDaysInMonth) * presentDays : 0;
      
      const basic = earnedGross * (rules.basicPercentage / 100);
      const hra = earnedGross * (rules.hraPercentage / 100);
      const specialAllowance = Math.max(0, earnedGross - basic - hra);
      const deductions = earnedGross * (rules.deductionPercentage / 100);
      
      const netPay = earnedGross - deductions;

      const salaryDetails: SalaryData = {
        presentDays,
        leaveDays,
        earnedGross,
        basic,
        hra,
        specialAllowance,
        deductions,
        netPay,
      };

      return {
        staff,
        salary: salaryDetails
      };
    });
  }, [staffList, isStaffInitialized, areRulesInitialized, rules, monthStart, monthEnd, totalDaysInMonth]);

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
  
  const isDataLoading = !isStaffInitialized || !areRulesInitialized || !currentDate;

  return (
    <>
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
              <p className="text-xs text-muted-foreground">For {currentMonthFormatted}</p>
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
              <p className="text-xs text-muted-foreground">Payroll for {totalDaysInMonth > 0 ? totalDaysInMonth : '...'} days</p>
            </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actions</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-2">
                   <Button size="sm" onClick={() => setIsRulesModalOpen(true)}>Salary Rules Setup</Button>
                   <Button size="sm" variant="secondary" disabled={!currentDate} onClick={() => handleSimulatedAction('Payroll processing simulated', `Payroll for all employees has been queued for processing.`)}>Run Payroll for {currentMonthShortFormatted}</Button>
              </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee-wise Salary for {currentMonthFormatted}</CardTitle>
            <CardDescription>Auto-calculated based on attendance data and your defined salary rules.</CardDescription>
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
                {isDataLoading ? (
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
        
        {selectedStaff && currentDate && (
           <PayslipModal 
              isOpen={isPayslipModalOpen}
              onOpenChange={setIsPayslipModalOpen}
              staff={selectedStaff.staff}
              salaryData={selectedStaff.salaryData}
              payPeriod={currentMonthFormatted}
           />
        )}
      </div>
      <SalaryRulesModal isOpen={isRulesModalOpen} onOpenChange={setIsRulesModalOpen} />
    </>
  );
}
