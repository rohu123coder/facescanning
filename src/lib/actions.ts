'use server'

import type { Staff } from './data';

export async function generateSalaryCsv(staff: Staff[]): Promise<string> {
    const headers = ['Staff ID', 'Name', 'Department', 'Role', 'Salary'];
    const rows = staff.map(employee => 
        [employee.id, employee.name, employee.department, employee.role, employee.salary].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}
