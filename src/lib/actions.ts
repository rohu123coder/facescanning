'use server'

import type { Staff } from './data';
import { format } from 'date-fns';

export async function generateAttendanceReportCsv(staff: Staff[]): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];
    const headers = ['Staff ID', 'Name', 'Email', 'Mobile', 'Department', 'Date', 'In-Time', 'Out-Time', 'Total Hours Worked'];
    
    const rows = staff.map(employee => {
        const attendance = employee.attendanceStatus?.date === todayStr ? employee.attendanceStatus : null;
        return [
            employee.id,
            employee.name,
            employee.email,
            employee.mobile,
            employee.department,
            attendance ? format(new Date(attendance.date), 'yyyy-MM-dd') : 'N/A',
            attendance?.inTime ?? 'N/A',
            attendance?.outTime ?? 'N/A',
            attendance?.totalHours ?? 'N/A'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}
