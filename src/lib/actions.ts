'use server'

import type { Staff, Student } from './data';
import { format } from 'date-fns';

export async function generateAttendanceReportCsv(staff: Staff[]): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];
    const headers = ['Staff ID', 'Name', 'Email', 'Mobile', 'Department', 'Role', 'Date', 'In-Time', 'Out-Time', 'Total Hours Worked'];
    
    const rows = staff.map(employee => {
        const attendance = employee.attendanceStatus?.date === todayStr ? employee.attendanceStatus : null;
        return [
            employee.id,
            employee.name,
            employee.email,
            employee.mobile,
            employee.department,
            employee.role,
            attendance ? format(new Date(attendance.date), 'yyyy-MM-dd') : 'N/A',
            attendance?.inTime ?? 'N/A',
            attendance?.outTime ?? 'N/A',
            attendance?.totalHours ?? 'N/A'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}


export async function generateStudentAttendanceReportCsv(students: Student[]): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];
    const headers = ['Student ID', 'Name', 'Class', 'Roll Number', 'Parent Name', 'Parent Mobile', 'Date', 'Arrival Time', 'Departure Time', 'Total Hours'];
    
    const rows = students.map(student => {
        const attendance = student.attendanceStatus?.date === todayStr ? student.attendanceStatus : null;
        return [
            student.id,
            student.name,
            student.className,
            student.rollNumber,
            student.parentName,
            student.parentMobile,
            attendance ? format(new Date(attendance.date), 'yyyy-MM-dd') : 'N/A',
            attendance?.inTime ?? 'N/A',
            attendance?.outTime ?? 'N/A',
            attendance?.totalHours ?? 'N/A'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}
