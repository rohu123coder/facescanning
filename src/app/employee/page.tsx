'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SalarySlip } from '@/components/salary-slip';
import { CheckCircle, XCircle, Clock, CalendarPlus, Paperclip, ClipboardCheck, CalendarIcon } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { useStaffStore } from '@/hooks/use-staff-store';
import { useSalaryRulesStore } from '@/hooks/use-salary-rules-store';
import { useLeaveStore } from '@/hooks/use-leave-store';
import { useHolidayStore } from '@/hooks/use-holiday-store';
import { type Staff, type AttendanceRecord, type SalaryData, type LeaveRequest, type Task } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ApplyLeaveModal } from '@/components/apply-leave-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTaskStore } from '@/hooks/use-task-store';
import { TaskCard } from '@/components/task-card';
import { TaskDetailsModal } from '@/components/task-details-modal';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';


const getStatusForRecord = (record: AttendanceRecord) => {
    if (record.inTime) return 'Present';
    return 'Absent';
}

const getStatusBadge = (status: 'Present' | 'Absent') => {
  switch (status) {
    case 'Present':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
    case 'Absent':
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
  }
};

const calculateSalary = (staff: Staff | null, rules: any, monthStart: Date, monthEnd: Date, paidLeaveDays: number): { staff: Staff | null, salaryData: SalaryData | null } => {
    if (!staff) return { staff: null, salaryData: null };
    
    // In a real app, workingDays would also be calculated here like on the client salary page.
    // For simplicity, we use total days in month for the denominator.
    const totalDaysInMonth = parseInt(format(monthEnd, 'd'), 10);
    const workingDays = totalDaysInMonth; // Simplification for employee view

    const presentDays = staff.attendanceRecords?.filter(rec => {
        const recDate = new Date(rec.date);
        return isWithinInterval(recDate, { start: monthStart, end: monthEnd });
    }).length ?? 0;
    
    const daysPaidFor = presentDays + paidLeaveDays;
    const unpaidLeaveDays = workingDays - daysPaidFor; // Simplification
    const adjustment = 0;

    const monthlyGrossSalary = staff.salary;
    const earnedGross = workingDays > 0 ? (monthlyGrossSalary / workingDays) * daysPaidFor : 0;
    
    const basic = earnedGross * (rules.basicPercentage / 100);
    const hra = earnedGross * (rules.hraPercentage / 100);
    const specialAllowance = Math.max(0, earnedGross - basic - hra);
    const deductions = earnedGross * (rules.deductionPercentage / 100);
    const netPay = earnedGross - deductions;

    const salaryDetails: SalaryData = {
        workingDays,
        presentDays,
        paidLeaveDays,
        unpaidLeaveDays,
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
        salaryData: salaryDetails
    };
};

export default function EmployeeDashboard() {
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // --- Auth and Data hooks ---
  const { currentEmployee: loggedInEmployee } = useEmployeeAuthStore();
  const { staffList, isInitialized: isStaffInitialized } = useStaffStore();
  const { rules, isInitialized: areRulesInitialized } = useSalaryRulesStore();
  const { leaveRequests, getApprovedLeavesForEmployee, isInitialized: leavesInitialized } = useLeaveStore();
  const { holidays, isInitialized: holidaysInitialized } = useHolidayStore();
  const { tasks, isInitialized: tasksInitialized } = useTaskStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [attendanceDateRange, setAttendanceDateRange] = useState<DateRange | undefined>();


  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);
    setAttendanceDateRange({
        from: startOfMonth(today),
        to: endOfMonth(today)
    });
  }, []);

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

  const approvedLeavesForMonth = useMemo(() => {
    if (!loggedInEmployee || !monthStart || !monthEnd || !leavesInitialized || !holidaysInitialized || !areRulesInitialized) {
        return { casual: 0, sick: 0, total: 0 };
    }
    const holidayDates = holidays.map(h => h.date);
    return getApprovedLeavesForEmployee(loggedInEmployee.id, monthStart, monthEnd, rules.weeklyOffDays, holidayDates);
  }, [loggedInEmployee, monthStart, monthEnd, getApprovedLeavesForEmployee, leavesInitialized, holidaysInitialized, holidays, areRulesInitialized, rules.weeklyOffDays]);
  
  const { salaryData } = useMemo(() => {
    if (!loggedInEmployee || !areRulesInitialized || !monthStart || !monthEnd) {
        return { salaryData: null };
    }
    return calculateSalary(loggedInEmployee, rules, monthStart, monthEnd, approvedLeavesForMonth.total);
  }, [loggedInEmployee, areRulesInitialized, rules, monthStart, monthEnd, approvedLeavesForMonth]);

  const employeeLeaveRequests = useMemo(() => {
      if (!loggedInEmployee || !leavesInitialized) return [];
      return leaveRequests.filter(r => r.employeeId === loggedInEmployee.id);
  }, [loggedInEmployee, leaveRequests, leavesInitialized]);

  const employeeTasks = useMemo(() => {
      if (!loggedInEmployee || !tasksInitialized) return [];
      return tasks.filter(t => t.assignedTo.includes(loggedInEmployee.id));
  }, [loggedInEmployee, tasks, tasksInitialized]);

  const filteredAttendance = useMemo(() => {
      if (!loggedInEmployee?.attendanceRecords || !attendanceDateRange?.from) return [];
      
      const attendance = loggedInEmployee.attendanceRecords.filter(rec => {
          const recDate = startOfDay(new Date(rec.date));
          return isWithinInterval(recDate, {
              start: startOfDay(attendanceDateRange.from!),
              end: startOfDay(attendanceDateRange.to ?? attendanceDateRange.from!),
          });
      });

      return attendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [loggedInEmployee, attendanceDateRange]);


  if (!loggedInEmployee) {
       return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
              <p className="text-muted-foreground">Loading employee data...</p>
            </div>
          </div>
      );
  }
  
  const remainingCasualLeaves = loggedInEmployee.totalCasualLeaves - approvedLeavesForMonth.casual;
  const remainingSickLeaves = loggedInEmployee.totalSickLeaves - approvedLeavesForMonth.sick;

  return (
    <>
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-headline font-bold">Employee Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {loggedInEmployee.name}. Your personal attendance and salary information.</p>
        </div>
        <Button onClick={() => setIsApplyLeaveModalOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Apply for Leave
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ClipboardCheck className="mr-2 h-5 w-5" /> My Tasks</CardTitle>
                    <CardDescription>Tasks assigned to you. Click a task for details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        {employeeTasks.length > 0 ? (
                            employeeTasks.map(task => (
                                <TaskCard key={task.id} task={task} staffList={staffList} onClick={() => setSelectedTask(task)} />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                <p>No tasks assigned to you.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>My Leaves</CardTitle>
                    <CardDescription>Your leave balance for the year.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                        <div>
                            <p className="font-semibold">Casual Leaves</p>
                            <p className="text-sm text-muted-foreground">Total: {loggedInEmployee.totalCasualLeaves}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-bold text-primary">{remainingCasualLeaves}</p>
                           <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                    </div>
                     <div className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                        <div>
                            <p className="font-semibold">Sick Leaves</p>
                            <p className="text-sm text-muted-foreground">Total: {loggedInEmployee.totalSickLeaves}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-bold text-primary">{remainingSickLeaves}</p>
                           <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Leave Request History</CardTitle>
                <CardDescription>Status of your submitted leave requests.</CardDescription>
                </CardHeader>
                <CardContent>
                <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Dates</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {employeeLeaveRequests.length > 0 ? (
                      employeeLeaveRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="text-xs">
                            <p className="font-semibold">{request.leaveType} Leave</p>
                            {format(parseISO(request.startDate), 'dd/MM/yy')} - {format(parseISO(request.endDate), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={
                                request.status === 'Approved' ? 'default' :
                                request.status === 'Rejected' ? 'destructive' :
                                'secondary'
                            } className={request.status === 'Approved' ? 'bg-green-600' : ''}>
                                {request.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">No leave requests found.</TableCell>
                      </TableRow>
                    )}
                    </TableBody>
                </Table>
                </ScrollArea>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <SalarySlip 
            staff={loggedInEmployee}
            salaryData={salaryData}
            payPeriod={currentMonthFormatted}
            payDate={payDateFormatted}
          />
           <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>My Attendance History</CardTitle>
                            <CardDescription>Your attendance records for the selected period.</CardDescription>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !attendanceDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {attendanceDateRange?.from ? (
                                    attendanceDateRange.to ? (
                                        <>
                                        {format(attendanceDateRange.from, "LLL dd, y")} - {format(attendanceDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(attendanceDateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={attendanceDateRange?.from}
                                selected={attendanceDateRange}
                                onSelect={setAttendanceDateRange}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>In-Time</TableHead>
                                <TableHead>Out-Time</TableHead>
                                <TableHead>Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttendance.length > 0 ? (
                                filteredAttendance.map(record => (
                                    <TableRow key={record.date}>
                                        <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                                        <TableCell>{getStatusBadge(getStatusForRecord(record))}</TableCell>
                                        <TableCell>{record.inTime || '--'}</TableCell>
                                        <TableCell>{record.outTime || '--'}</TableCell>
                                        <TableCell>{record.totalHours || '--'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No attendance records for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    <ApplyLeaveModal isOpen={isApplyLeaveModalOpen} onOpenChange={setIsApplyLeaveModalOpen} employeeId={loggedInEmployee.id} />
    {selectedTask && (
        <TaskDetailsModal
            isOpen={!!selectedTask}
            onOpenChange={() => setSelectedTask(null)}
            task={selectedTask}
            currentUser={loggedInEmployee}
        />
    )}
    </>
  );
}
