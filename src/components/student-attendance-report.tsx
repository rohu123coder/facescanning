
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';
import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { addDays, format, differenceInHours, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { type Attendance } from '@/lib/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function StudentAttendanceReport() {
  const { attendance, isInitialized } = useStudentAttendanceStore();
  const { students, isInitialized: isStudentInitialized } = useStudentStore();
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const [classFilter, setClassFilter] = React.useState('All');
  const [studentFilter, setStudentFilter] = React.useState('All');
  const [reportData, setReportData] = React.useState<Attendance[] | null>(null);
  
  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  };

  const classNames = ['All', ...Array.from(new Set(students.map(s => s.className)))];
  const studentsInClass = classFilter === 'All' ? students : students.filter(s => s.className === classFilter);

  const handleGenerateReport = () => {
    if (isInitialized && date?.from && date?.to) {
        const fromDate = format(date.from, 'yyyy-MM-dd');
        const toDate = format(date.to, 'yyyy-MM-dd');

        let filtered = attendance.filter(record => {
            const recordDate = record.date;
            return recordDate >= fromDate && recordDate <= toDate;
        });

        if (classFilter !== 'All') {
            const studentIdsInClass = students.filter(s => s.className === classFilter).map(s => s.id);
            filtered = filtered.filter(record => studentIdsInClass.includes(record.personId));
        }

        if (studentFilter !== 'All') {
            filtered = filtered.filter(record => record.personId === studentFilter);
        }

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
    csvContent += "Student Name,Date,In Time,Out Time,Total Hours\n";

    reportData.forEach(record => {
        const studentName = getStudentName(record.personId);
        const inTime = record.inTime ? format(parseISO(record.inTime), 'p') : 'N/A';
        const outTime = record.outTime ? format(parseISO(record.outTime), 'p') : 'N/A';
        const totalHours = calculateTotalHours(record.inTime, record.outTime);
        const row = [studentName, record.date, inTime, outTime, totalHours].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth - 20; // with margin
            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 10, 10, width, height);
            pdf.save(`student_attendance_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            printHideElements.forEach(el => el.classList.remove('hidden-for-print'));
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Attendance Report</CardTitle>
        <CardDescription>Select filters to view and export student attendance.</CardDescription>
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
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
                {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
           <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Student" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All">All Students</SelectItem>
                {studentsInClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
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
                <TableHead>Student Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>In Time</TableHead>
                <TableHead>Out Time</TableHead>
                <TableHead>Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialized && isStudentInitialized ? (
                reportData === null ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Please select filters and click "View Report".
                        </TableCell>
                    </TableRow>
                ) : reportData.length > 0 ? (
                  reportData.map(record => (
                    <TableRow key={`${record.personId}-${record.date}`}>
                      <TableCell className="font-medium">{getStudentName(record.personId)}</TableCell>
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
