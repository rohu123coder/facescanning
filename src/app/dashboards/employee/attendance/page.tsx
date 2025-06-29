
'use client';

import { useMemo } from 'react';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coffee, CalendarCheck2 } from 'lucide-react';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

export default function MyAttendancePage() {
    const { currentEmployeeId } = useEmployeeAuthStore();
    const { staff } = useStaffStore();
    const { attendance, isInitialized } = useAttendanceStore();

    const currentEmployee = staff.find(s => s.id === currentEmployeeId);
    
    const myAttendance = useMemo(() => {
        if (!isInitialized || !currentEmployeeId) return [];
        return attendance
            .filter(a => a.personId === currentEmployeeId)
            .sort((a,b) => b.date.localeCompare(a.date));
    }, [attendance, currentEmployeeId, isInitialized]);
    
    const calculateTotalHours = (inTime: string | null, outTime: string | null): string => {
        if (!inTime || !outTime) return 'N/A';
        const start = parseISO(inTime);
        const end = parseISO(outTime);
        const hours = differenceInHours(end, start);
        const minutes = differenceInMinutes(end, start) % 60;
        return `${hours}h ${minutes}m`;
    };

    const totalDaysPresent = myAttendance.length;
    const avgHours = useMemo(() => {
        const recordsWithHours = myAttendance.filter(a => a.inTime && a.outTime);
        if (recordsWithHours.length === 0) return '0h 0m';
        const totalMinutes = recordsWithHours.reduce((acc, curr) => {
            return acc + differenceInMinutes(parseISO(curr.outTime!), parseISO(curr.inTime!));
        }, 0);
        const avgMinutes = totalMinutes / recordsWithHours.length;
        const hours = Math.floor(avgMinutes / 60);
        const minutes = Math.round(avgMinutes % 60);
        return `${hours}h ${minutes}m`;
    }, [myAttendance]);


    const stats = [
        { title: 'Total Days Present', value: totalDaysPresent, icon: <CalendarCheck2 className="text-muted-foreground" /> },
        { title: 'Average Working Hours', value: avgHours, icon: <Coffee className="text-muted-foreground" /> },
    ];

    if (!currentEmployee) {
        return <div>Loading employee data...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Attendance</h1>
                <p className="text-muted-foreground">View your attendance history, recorded via the Face Scan Kiosk.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>A log of all your recorded attendance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>In Time</TableHead>
                                <TableHead>Out Time</TableHead>
                                <TableHead>Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isInitialized && myAttendance.length > 0 ? (
                                myAttendance.map(record => (
                                    <TableRow key={record.date}>
                                        <TableCell>{format(parseISO(record.date), 'PP')}</TableCell>
                                        <TableCell>{record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A'}</TableCell>
                                        <TableCell>{record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A'}</TableCell>
                                        <TableCell>{calculateTotalHours(record.inTime, record.outTime)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No attendance records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
