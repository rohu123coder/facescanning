export type Staff = {
  id: string;
  name: string;
  department: string;
  role: string;
  salary: number;
};

export type Client = {
  id: string;
  name: string;
  plan: 'Basic' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Inactive';
  staffCount: number;
};

export type Attendance = {
    date: string;
    status: 'Present' | 'Absent' | 'Leave';
}

export const staff: Staff[] = [
  { id: 'KM-001', name: 'Aarav Sharma', department: 'Engineering', role: 'Frontend Developer', salary: 75000 },
  { id: 'KM-002', name: 'Diya Patel', department: 'Design', role: 'UI/UX Designer', salary: 72000 },
  { id: 'KM-003', name: 'Rohan Mehta', department: 'Engineering', role: 'Backend Developer', salary: 80000 },
  { id: 'KM-004', name: 'Priya Singh', department: 'Product', role: 'Product Manager', salary: 95000 },
  { id: 'KM-005', name: 'Aditya Kumar', department: 'QA', role: 'QA Engineer', salary: 65000 },
];

export const clients: Client[] = [
    { id: 'C-101', name: 'Innovatech Solutions', plan: 'Premium', status: 'Active', staffCount: 45 },
    { id: 'C-102', name: 'Creative Minds Inc.', plan: 'Basic', status: 'Active', staffCount: 12 },
    { id: 'C-103', name: 'TechForward', plan: 'Enterprise', status: 'Active', staffCount: 150 },
    { id: 'C-104', name: 'NextGen Systems', plan: 'Premium', status: 'Inactive', staffCount: 30 },
]

export const attendance: Attendance[] = [
    { date: '2024-07-01', status: 'Present' },
    { date: '2024-07-02', status: 'Present' },
    { date: '2024-07-03', status: 'Present' },
    { date: '2024-07-04', status: 'Leave' },
    { date: '2024-07-05', status: 'Present' },
    { date: '2024-07-06', status: 'Present' },
    { date: '2024-07-07', status: 'Present' },
    { date: '2024-07-08', status: 'Absent' },
    { date: '2024-07-09', status: 'Present' },
    { date: '2024-07-10', status: 'Present' },
];
