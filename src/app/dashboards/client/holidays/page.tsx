
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHolidayStore } from '@/hooks/use-holiday-store.tsx';
import { Calendar, PlusCircle, Trash2, PartyPopper } from 'lucide-react';
import { HolidayManagementModal } from '@/components/holiday-management-modal';
import { format, getYear, isFuture, differenceInDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HolidaysPage() {
  const { holidays, isInitialized, removeHoliday } = useHolidayStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentYear = getYear(new Date());
  const totalThisYear = holidays.filter(h => getYear(new Date(h.date)) === currentYear).length;
  const upcomingIn30Days = holidays.filter(h => {
      const holidayDate = new Date(h.date);
      // Ensure the date is in the future and within 30 days from today
      return isFuture(holidayDate) && differenceInDays(holidayDate, new Date()) <= 30;
  }).length;
  
  const stats = [
    { title: `Holidays in ${currentYear}`, value: totalThisYear, icon: <Calendar className="text-muted-foreground" /> },
    { title: 'Upcoming (Next 30 days)', value: upcomingIn30Days, icon: <PartyPopper className="text-muted-foreground" /> },
  ];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Holiday Dashboard</h1>
            <p className="text-muted-foreground">An overview and management of your organization's holidays.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
             <PlusCircle className="mr-2" /> Add/Manage Holidays
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="flex items-center gap-2"><Calendar /> Holiday Calendar</CardTitle>
            <CardDescription>
                A list of all official holidays. These days are automatically considered paid leave and excluded from working day calculations in salary reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Holiday Name</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isInitialized && holidays.length > 0 ? (
                        holidays.map(holiday => (
                            <TableRow key={holiday.id}>
                                <TableCell className="font-medium">{format(new Date(holiday.date), "PPP")}</TableCell>
                                <TableCell>{holiday.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => removeHoliday(holiday.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                {isInitialized ? "No holidays have been added yet." : "Loading holidays..."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <HolidayManagementModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
