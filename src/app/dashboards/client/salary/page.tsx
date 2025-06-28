'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, CalendarCheck, Clock, Settings, MoreHorizontal, Mail, FileDown, AlertCircle } from 'lucide-react';
import { useStaffStore } from '@/hooks/use-staff-store';
import { endOfMonth, format, isWithinInterval, startOfMonth, addDays, getDay } from 'date-fns';
import { PayslipModal } from '@/components/payslip-modal';
import { type Staff, type SalaryData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { useHolidayStore } from '@/hooks/use-holiday-store';
import { useLeaveStore } from '@/hooks/use-leave-store';
import { SalaryRulesModal } from '@/components/salary-rules-modal';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SalaryManagementPage() {
  const { staffList, isInitialized: isStaffInitialized } = useStaffStore();
  const { rules, isInitialized: areRulesInitialized } = useSalaryRulesStore();
  const { holidays, isInitialized: holidaysInitialized } = useHolidayStore();
  const { getApprovedLeavesForEmployee, isInitialized: leavesInitialized } = useLeaveStore();
  const { toast } = useToast();
  
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ staff: Staff, salaryData: SalaryData } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const { monthStart, monthEnd, totalDaysInMonth, workingDays, currentMonthFormatted, currentMonthShortFormatted } = useMemo(() => {
    if (!currentDate || !holidaysInitialized || !areRulesInitialized) {
      return { monthStart: null, monthEnd: null, totalDaysInMonth: 0, workingDays: 0, currentMonthFormatted: 'Loading...', currentMonthShortFormatted: '...' };
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = parseInt(format(end, 'd'), 10);
    
    const holidayDates = holidays.map(h => format(new Date(h.date), 'yyyy-MM-dd'));
    const holidaysInMonth = new Set(holidayDates);

    let calculatedWorkingDays = 0;
    for (let i = 0; i < daysInMonth; i++) {
        const day = addDays(start, i);
        if (!rules.weeklyOffDays.includes(getDay(day)) && !holidaysInMonth.has(format(day, 'yyyy-MM-dd'))) {
            calculatedWorkingDays++;
        }
    }

    return { 
        monthStart: start, 
        monthEnd: end, 
        totalDaysInMonth: daysInMonth,
        workingDays: calculatedWorkingDays,
        currentMonthFormatted: format(currentDate, 'MMMM yyyy'),
        currentMonthShortFormatted: format(currentDate, 'MMMM')
    };
  }, [currentDate, holidays, holidaysInitialized, rules, areRulesInitialized]);

  const handleAdjustmentChange = (staffId: string, value: string) => {
    if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) return;
    setAdjustments(prev => ({
      ...prev,
      [staffId]: value,
    }));
  };

  const salaryData = useMemo(() => {
    if (!isStaffInitialized || !areRulesInitialized || !leavesInitialized || !monthStart || !monthEnd || workingDays === 0) return [];
    
    const holidayDates = holidays.map(h => format(new Date(h.date), 'yyyy-MM-dd'));

    return staffList.map(staff => {
      const presentDays = staff.attendanceRecords?.filter(rec => {
        const recDate = new Date(rec.date);
        return isWithinInterval(recDate, { start: monthStart, end: monthEnd });
      }).length ?? 0;

      const adjustment = Number(adjustments[staff.id]) || 0;
      const approvedLeaves = getApprovedLeavesForEmployee(staff.id, monthStart, monthEnd, rules.weeklyOffDays, holidayDates);
      const paidLeaveDays = approvedLeaves.total;
      
      const daysPaidFor = presentDays + paidLeaveDays;
      const unpaidLeaveDays = workingDays - daysPaidFor;
      
      const monthlyGrossSalary = staff.salary;
      const earnedGross = workingDays > 0 ? (monthlyGrossSalary / workingDays) * daysPaidFor : 0;
      
      const basic = earnedGross * (rules.basicPercentage / 100);
      const hra = earnedGross * (rules.hraPercentage / 100);
      const specialAllowance = Math.max(0, earnedGross - basic - hra);
      const deductions = earnedGross * (rules.deductionPercentage / 100);
      
      const netPay = earnedGross - deductions + adjustment;

      const salaryDetails: SalaryData = {
        workingDays,
        presentDays,
        paidLeaveDays,
        unpaidLeaveDays: Math.max(0, unpaidLeaveDays),
        earnedGross,
        basic,
        hra,
        specialAllowance,
        deductions,
        adjustment,
        netPay,
      };

      return {
        staff,
        salary: salaryDetails
      };
    });
  }, [staffList, isStaffInitialized, areRulesInitialized, rules, leavesInitialized, getApprovedLeavesForEmployee, holidays, monthStart, monthEnd, workingDays, adjustments]);

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
  
  const isDataLoading = !isStaffInitialized || !areRulesInitialized || !holidaysInitialized || !leavesInitialized || !currentDate;

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">Automate payroll, manage salaries, and generate payslips based on attendance & approved leaves.</p>
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
              <CardTitle className="text-sm font-medium">Working Days This Month</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workingDays > 0 ? workingDays : '...'} days</div>
              <p className="text-xs text-muted-foreground">(Excludes weekly off-days & holidays)</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffList.length}</div>
              <p className="text-xs text-muted-foreground">Payroll for {totalDaysInMonth > 0 ? totalDaysInMonth : '...'} days in {currentMonthShortFormatted}</p>
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
            <CardDescription>Auto-calculated based on attendance and approved leaves. LWP is auto-deducted for unapproved absences.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">
                     <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help border-b border-dashed">Paid Leave</span></TooltipTrigger>
                        <TooltipContent><p>Total approved Casual and Sick leaves for this month.</p></TooltipContent>
                     </Tooltip>
                  </TableHead>
                  <TableHead className="text-center">
                    <Tooltip>
                        <TooltipTrigger asChild><span className="cursor-help border-b border-dashed">Unpaid (LWP)</span></TooltipTrigger>
                        <TooltipContent><p>Absences not covered by approved leave (LWP).</p></TooltipContent>
                     </Tooltip>
                  </TableHead>
                  <TableHead className="text-center">Adjustment (₹)</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading salary data...
                    </TableCell>
                  </TableRow>
                ) : salaryData.length > 0 ? (
                  salaryData.map(({ staff, salary }) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell className="text-center"><Badge variant="default" className="bg-green-600 w-20 justify-center">{salary.presentDays} / {workingDays}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="w-20 justify-center">{salary.paidLeaveDays}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {salary.unpaidLeaveDays > 0 ? (
                           <Badge variant="destructive" className="w-20 justify-center">
                               <AlertCircle className="mr-1 h-3 w-3"/> {salary.unpaidLeaveDays}
                           </Badge>
                        ) : (
                           <Badge variant="secondary" className="w-20 justify-center">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                         <Input
                          type="number"
                          placeholder="0"
                          value={adjustments[staff.id] || ''}
                          onChange={(e) => handleAdjustmentChange(staff.id, e.target.value)}
                          className="h-8 w-24 text-center mx-auto"
                          step="100"
                        />
                      </TableCell>
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      No staff members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TooltipProvider>
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
