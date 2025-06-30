
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParentAuthStore } from '@/hooks/use-parent-auth-store.tsx';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';
import { format, parseISO, getMonth, getYear, differenceInHours } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, GraduationCap } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function ParentDashboardPage() {
    const { student, isAuthInitialized } = useParentAuthStore();
    const { attendance, isInitialized: isAttendanceInitialized } = useStudentAttendanceStore();
    
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

    const filteredAttendance = useMemo(() => {
        if (!student) return [];
        return attendance
            .filter(record => 
                record.personId === student.id &&
                getMonth(parseISO(record.date)) === parseInt(selectedMonth) &&
                getYear(parseISO(record.date)) === parseInt(selectedYear)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, student, selectedMonth, selectedYear]);

    const calculateTotalHours = (inTime: string | null, outTime: string | null): string => {
        if (!inTime || !outTime) return 'N/A';
        try {
            const hours = differenceInHours(parseISO(outTime), parseISO(inTime));
            return `${hours} hour(s)`;
        } catch (error) {
            return 'Invalid';
        }
    };
    
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
    
    if (!isAuthInitialized || !isAttendanceInitialized || !student) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Child's Dashboard</h1>
                <p className="text-muted-foreground">Welcome! Here is an overview of {student.name}'s attendance.</p>
            </div>
            
             <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className='w-20 h-20'>
                        <AvatarImage src={student.photoUrl} alt={student.name}/>
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-2xl">{student.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                           <GraduationCap className="h-4 w-4"/> Class: {student.className} | Roll No: {student.rollNumber}
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>View your child's attendance log for a selected period.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
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
                    </div>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Check-in Time</TableHead>
                                    <TableHead>Check-out Time</TableHead>
                                    <TableHead>Total Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttendance.length > 0 ? (
                                    filteredAttendance.map(record => (
                                        <TableRow key={record.date}>
                                            <TableCell>{format(parseISO(record.date), 'PPP')}</TableCell>
                                            <TableCell>{record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A'}</TableCell>
                                            <TableCell>{calculateTotalHours(record.inTime, record.outTime)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No attendance records found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
