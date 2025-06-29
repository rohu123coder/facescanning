
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { addDays, format, differenceInHours, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { type Attendance } from '@/lib/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function AttendanceReport() {
  const { attendance, isInitialized } = useAttendanceStore();
  const { staff, isInitialized: isStaffInitialized } = useStaffStore();
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const [reportData, setReportData] = React.useState<Attendance[] | null>(null);
  
  const getStaffName = React.useCallback((staffId: string) => {
    return staff.find(s => s.id === staffId)?.name || 'Unknown Staff';
  }, [staff]);

  const handleGenerateReport = () => {
    if (isInitialized && date?.from && date?.to) {
        const fromDate = format(date.from, 'yyyy-MM-dd');
        const toDate = format(date.to, 'yyyy-MM-dd');

        const filtered = attendance.filter(record => {
            return record.date >= fromDate && record.date <= toDate;
        });
        setReportData(filtered.sort((a, b) => b.date.localeCompare(a.date)));
    } else {
        setReportData([]);
    }
  };

  const calculateTotalHours = (inTime: string | null, outTime: string | null): string => {
    if (!inTime || !outTime) return 'N/A';
    const hours = differenceInHours(parseISO(outTime), parseISO(inTime));
    return `${hours} hour(s)`;
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Staff Name,Date,In Time,Out Time,Total Hours\n";

    reportData.forEach(record => {
        const staffName = getStaffName(record.personId);
        const inTime = record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A';
        const outTime = record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A';
        const totalHours = calculateTotalHours(record.inTime, record.outTime);
        const row = [staffName, record.date, inTime, outTime, totalHours].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const input = document.getElementById('report-table');
    if (input) {
        const printHideElements = document.querySelectorAll('.print-hide');
        printHideElements.forEach(el => el.classList.add('hidden-for-print'));
        
        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth - 20; // with margin
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 10, 10, width, height);
            pdf.save(`attendance_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            printHideElements.forEach(el => el.classList.remove('hidden-for-print'));
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Report</CardTitle>
        <CardDescription>Select a date range to view and export staff attendance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerateReport}>
            <Search className="mr-2" /> View Report
          </Button>
          <div className="flex gap-2 print-hide">
            <Button variant="outline" onClick={handleExportCSV} disabled={!reportData || reportData.length === 0}>
                <FileSpreadsheet className="mr-2"/> Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!reportData || reportData.length === 0}>
                <FileText className="mr-2"/> Export PDF
            </Button>
          </div>
        </div>
        
        <div id="report-table" className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>In Time</TableHead>
                <TableHead>Out Time</TableHead>
                <TableHead>Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialized && isStaffInitialized ? (
                reportData === null ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Please select a date range and click "View Report".
                        </TableCell>
                    </TableRow>
                ) : reportData.length > 0 ? (
                  reportData.map(record => (
                    <TableRow key={`${record.staffId}-${record.date}`}>
                      <TableCell className="font-medium">{getStaffName(record.personId)}</TableCell>
                      <TableCell>{format(parseISO(record.date), 'PP')}</TableCell>
                      <TableCell>{record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A'}</TableCell>
                      <TableCell>{record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A'}</TableCell>
                      <TableCell>{calculateTotalHours(record.inTime, record.outTime)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No attendance records found for the selected period.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading attendance data...
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
