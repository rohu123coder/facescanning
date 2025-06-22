'use server'

import type { Staff, Student } from './data';
import { format } from 'date-fns';

export async function generateAttendanceReportCsv(staff: Staff[], date: string): Promise<string> {
    const headers = ['Staff ID', 'Name', 'Email', 'Mobile', 'Department', 'Role', 'Date', 'In-Time', 'Out-Time', 'Total Hours Worked'];
    
    const rows = staff.map(employee => {
        const attendance = employee.attendanceStatus?.date === date ? employee.attendanceStatus : null;
        return [
            employee.id,
            employee.name,
            employee.email,
            employee.mobile,
            employee.department,
            employee.role,
            attendance ? format(new Date(attendance.date), 'yyyy-MM-dd') : date,
            attendance?.inTime ?? 'N/A',
            attendance?.outTime ?? 'N/A',
            attendance?.totalHours ?? 'N/A'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}


export async function generateStudentAttendanceReportCsv(students: Student[], date: string): Promise<string> {
    const headers = ['Student ID', 'Name', 'Email', 'Class', 'Roll Number', 'Gender', 'DOB', 'Religion', 'Father Name', "Mother's Name", 'Parent Mobile', 'Parent WhatsApp', 'Date', 'Arrival Time', 'Departure Time', 'Total Hours'];
    
    const rows = students.map(student => {
        const attendance = student.attendanceStatus?.date === date ? student.attendanceStatus : null;
        return [
            student.id,
            student.name,
            student.email,
            student.className,
            student.rollNumber,
            student.gender,
            student.dob,
            student.religion,
            student.fatherName,
            student.motherName,
            student.parentMobile,
            student.parentWhatsapp,
            attendance ? format(new Date(attendance.date), 'yyyy-MM-dd') : date,
            attendance?.inTime ?? 'N/A',
            attendance?.outTime ?? 'N/A',
            attendance?.totalHours ?? 'N/A'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}
