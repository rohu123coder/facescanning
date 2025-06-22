'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SalarySlip } from '@/components/salary-slip';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { type Staff, type AttendanceRecord, type SalaryData } from '@/lib/data';

const getStatusForRecord = (record: AttendanceRecord) => {
    if (record.inTime) return 'Present';
    // This is a simplification. In a real app, you'd have explicit leave records.
    return 'Absent';
}

const getStatusBadge = (status: 'Present' | 'Absent' | 'Leave') => {
  switch (status) {
    case 'Present':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Absent':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Leave':
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
  }
};

const calculateSalary = (staff: Staff | null, rules: any, monthStart: Date, monthEnd: Date): { staff: Staff | null, salaryData: SalaryData | null } => {
    if (!staff) return { staff: null, salaryData: null };
    
    const totalDaysInMonth = parseInt(format(monthEnd, 'd'), 10);

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
        salaryData: salaryDetails
    };
};

export default function EmployeeDashboard() {
  const [isClient, setIsClient] = useState(false);
  
  // --- Data hooks ---
  const { staffList, isInitialized: isStaffInitialized } = useStaffStore();
  const { rules, isInitialized: areRulesInitialized } = useSalaryRulesStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setIsClient(true);
    setCurrentDate(new Date());
  }, []);

  // --- Logged in employee simulation ---
  const loggedInEmployee = useMemo(() => {
    if (!isStaffInitialized) return null;
    // For demonstration, we'll find 'Diya Patel' (KM-002) or default to the first employee
    return staffList.find(s => s.id === 'KM-002') || staffList[0] || null;
  }, [staffList, isStaffInitialized]);

  // --- Date and Salary Calculation ---
  const { monthStart, monthEnd, currentMonthFormatted, payDateFormatted } = useMemo(() => {
    if (!currentDate) {
        return { monthStart: null, monthEnd: null, currentMonthFormatted: '...', payDateFormatted: '...' };
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return {
        monthStart: start,
        monthEnd: end,
        currentMonthFormatted: format(currentDate, 'MMMM yyyy'),
        payDateFormatted: format(end, 'dd MMM, yyyy')
    };
  }, [currentDate]);
  
  const { salaryData } = useMemo(() => {
    if (!loggedInEmployee || !areRulesInitialized || !monthStart || !monthEnd) {
        return { salaryData: null };
    }
    return calculateSalary(loggedInEmployee, rules, monthStart, monthEnd);
  }, [loggedInEmployee, areRulesInitialized, rules, monthStart, monthEnd]);

  const attendanceForMonth = useMemo(() => {
    if (!loggedInEmployee?.attendanceRecords || !monthStart || !monthEnd) return [];
    return loggedInEmployee.attendanceRecords
        .filter(rec => isWithinInterval(new Date(rec.date), { start: monthStart, end: monthEnd }))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loggedInEmployee, monthStart, monthEnd]);


  if (!isClient || !isStaffInitialized) {
      return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
              <p className="text-muted-foreground">Loading your personal information...</p>
            </div>
          </div>
      );
  }

  if (!loggedInEmployee) {
       return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
              <p className="text-muted-foreground">No employee data found. Please contact an administrator.</p>
            </div>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
        <p className="text-muted-foreground">Your personal attendance and salary information.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Name:</strong> {loggedInEmployee.name}</p>
                    <p><strong>Employee ID:</strong> {loggedInEmployee.id}</p>
                    <p><strong>Department:</strong> {loggedInEmployee.department}</p>
                    <p><strong>Role:</strong> {loggedInEmployee.role}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Attendance Log</CardTitle>
                <CardDescription>Your attendance for {currentMonthFormatted}.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {attendanceForMonth.length > 0 ? (
                      attendanceForMonth.map((record) => (
                        <TableRow key={record.date}>
                          <TableCell>{format(new Date(record.date), 'dd MMMM, yyyy')}</TableCell>
                          <TableCell className="text-right">{getStatusBadge(getStatusForRecord(record))}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">No attendance records for this month.</TableCell>
                      </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
          <SalarySlip 
            staff={loggedInEmployee}
            salaryData={salaryData}
            payPeriod={currentMonthFormatted}
            payDate={payDateFormatted}
          />
        </div>
      </div>
    </div>
  );
}
