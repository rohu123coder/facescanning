
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHolidayStore } from '@/hooks/use-holiday-store.tsx';
import { format, getMonth, getYear } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays } from 'lucide-react';

export default function ParentHolidaysPage() {
    const { holidays, isInitialized } = useHolidayStore();
    
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

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

    const filteredHolidays = useMemo(() => {
        if (!isInitialized) return [];
        return holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return getMonth(holidayDate) === parseInt(selectedMonth) && getYear(holidayDate) === parseInt(selectedYear);
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [holidays, selectedMonth, selectedYear, isInitialized]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Holiday Calendar</h1>
                <p className="text-muted-foreground">List of official holidays for the organization.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays /> Official Holidays</CardTitle>
                    <CardDescription>
                        Below are the declared holidays for the selected month and year.
                    </CardDescription>
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
                                    <TableHead>Holiday Name</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isInitialized && filteredHolidays.length > 0 ? (
                                    filteredHolidays.map(holiday => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">{format(new Date(holiday.date), "PPP")}</TableCell>
                                            <TableCell>{holiday.name}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            {isInitialized ? "No holidays found for this period." : "Loading holidays..."}
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
