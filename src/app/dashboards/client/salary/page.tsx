
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useLeaveStore } from '@/hooks/use-leave-store.tsx';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store.tsx';
import { useHolidayStore } from '@/hooks/use-holiday-store.tsx';
import { getDaysInMonth, getYear, getMonth, format, isWithinInterval, parseISO } from 'date-fns';
import { SalaryRulesModal } from '@/components/salary-rules-modal';
import { PayslipModal } from '@/components/payslip-modal';
import { type Staff, type SalarySlipData } from '@/lib/data';
import { useSalarySlipsStore } from '@/hooks/use-salary-slips-store.tsx';
import { useToast } from '@/hooks/use-toast';

export default function SalaryPage() {
  const { staff } = useStaffStore();
  const { attendance } = useAttendanceStore();
  const { requests: leaveRequests } = useLeaveStore();
  const { rules } = useSalaryRulesStore();
  const { holidays } = useHolidayStore();
  const { slips, addOrUpdateSlips } = useSalarySlipsStore();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [lastGeneratedPeriod, setLastGeneratedPeriod] = useState<{month: string, year: string} | null>(null);
  
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipData | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i),
      label: format(new Date(2000, i), 'MMMM'),
    }));
  }, []);

  const generatedSlipsForPeriod = useMemo(() => {
    if (!lastGeneratedPeriod) return null;
    return slips.filter(s => s.month === months[parseInt(lastGeneratedPeriod.month)].label && s.year === lastGeneratedPeriod.year);
  }, [slips, lastGeneratedPeriod, months]);
  
  const handleGenerateSlips = () => {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const monthStartDate = new Date(year, month, 1);
      const monthEndDate = new Date(year, month + 1, 0);
      const totalDaysInMonth = getDaysInMonth(monthStartDate);

      const monthHolidays = holidays
        .filter(h => {
            const holidayDate = parseISO(h.date);
            return getYear(holidayDate) === year && getMonth(holidayDate) === month;
        })
        .map(h => format(parseISO(h.date), 'yyyy-MM-dd'));

      const workingDaysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)
        .map(day => new Date(year, month, day))
        .filter(date => {
            const isOffDay = rules.offDays.includes(String(date.getDay()) as "0"|"1"|"2"|"3"|"4"|"5"|"6");
            const isHoliday = monthHolidays.includes(format(date, 'yyyy-MM-dd'));
            return !isOffDay && !isHoliday;
        })
        .length;

      const newSlips = staff.map(employee => {
          const employeeAttendance = attendance.filter(a => 
            a.personId === employee.id && 
            getMonth(parseISO(a.date)) === month && 
            getYear(parseISO(a.date)) === year
          );
          
          const approvedLeaves = leaveRequests.filter(l => 
            l.staffId === employee.id &&
            l.status === 'Approved'
          );

          let paidLeaveDays = 0;
          approvedLeaves.forEach(leave => {
              const leaveStart = parseISO(leave.startDate);
              const leaveEnd = parseISO(leave.endDate);
              for (let i = 1; i <= totalDaysInMonth; i++) {
                const currentDate = new Date(year, month, i);
                if (isWithinInterval(currentDate, { start: leaveStart, end: leaveEnd })) {
                    paidLeaveDays++;
                }
              }
          });

          const presentDays = employeeAttendance.length;
          const totalPaidDays = Math.min(workingDaysInMonth, presentDays + paidLeaveDays);
          const lopDays = Math.max(0, workingDaysInMonth - totalPaidDays);

          const perDaySalary = employee.salary / workingDaysInMonth;
          const earnedGross = totalPaidDays * perDaySalary;
          const lopDeduction = lopDays * perDaySalary;
          
          const basic = earnedGross * (rules.basic / 100);
          const hra = earnedGross * (rules.hra / 100);
          const specialAllowance = earnedGross - basic - hra;
          const standardDeduction = earnedGross * (rules.standardDeduction / 100);
          
          const totalEarnings = basic + hra + specialAllowance;
          const totalDeductions = lopDeduction + standardDeduction;

          const netSalary = earnedGross - standardDeduction;

          return {
            id: `${employee.id}-${month}-${year}`,
            staffId: employee.id,
            staffName: employee.name,
            staffRole: employee.role,
            month: months[month].label,
            year: String(year),
            totalDays: totalDaysInMonth,
            workingDays: workingDaysInMonth,
            paidDays: totalPaidDays,
            lopDays: lopDays,
            grossSalary: employee.salary,
            earnedBasic: basic,
            earnedHra: hra,
            earnedSpecialAllowance: specialAllowance,
            totalEarnings: totalEarnings,
            lopDeduction: lopDeduction,
            standardDeduction: standardDeduction,
            totalDeductions: totalDeductions,
            netSalary: netSalary,
          };
      });
      
      addOrUpdateSlips(newSlips);
      setLastGeneratedPeriod({ month: selectedMonth, year: selectedYear });
      
      toast({
        title: 'Salaries Generated',
        description: `Payslips for ${months[month].label}, ${year} have been created and notifications sent.`
      });

      // Notify employees
      newSlips.forEach(slip => {
          window.dispatchEvent(new CustomEvent('salary-generated', { 
              detail: { staffId: slip.staffId } 
          }));
      });
  };

  const viewPayslip = (slip: SalarySlipData) => {
    setSelectedSlip(slip);
    setIsPayslipModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Salary Automation</h1>
            <p className="text-muted-foreground">Generate and manage staff salary slips.</p>
          </div>
          <Button onClick={() => setIsRulesModalOpen(true)}>Salary Rules</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Salary Slips</CardTitle>
            <CardDescription>Select a month and year to generate slips based on attendance and salary rules.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateSlips}>Generate Slips</Button>
          </CardContent>
        </Card>
        
        {generatedSlipsForPeriod && (
          <Card>
            <CardHeader>
                <CardTitle>Salary Report for {months[parseInt(selectedMonth)].label}, {selectedYear}</CardTitle>
                <CardDescription>Below is the summary of generated salaries.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Staff Name</TableHead>
                            <TableHead>Gross Salary</TableHead>
                            <TableHead>Working Days</TableHead>
                            <TableHead>Paid Days</TableHead>
                            <TableHead>LOP Days</TableHead>
                            <TableHead>Total Deductions</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {generatedSlipsForPeriod.map(slip => (
                            <TableRow key={slip.id}>
                                <TableCell>{slip.staffName}</TableCell>
                                <TableCell>₹{slip.grossSalary.toFixed(2)}</TableCell>
                                <TableCell>{slip.workingDays}</TableCell>
                                <TableCell>{slip.paidDays}</TableCell>
                                <TableCell>{slip.lopDays}</TableCell>
                                <TableCell>₹{slip.totalDeductions.toFixed(2)}</TableCell>
                                <TableCell className="font-bold">₹{slip.netSalary.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => viewPayslip(slip)}>View Payslip</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        )}
      </div>
      <SalaryRulesModal isOpen={isRulesModalOpen} onOpenChange={setIsRulesModalOpen} />
      <PayslipModal isOpen={isPayslipModalOpen} onOpenChange={setIsPayslipModalOpen} slipData={selectedSlip} />
    </>
  );
}
