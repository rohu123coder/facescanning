export type Holiday = {
    date: string; // ISO string for date 'yyyy-MM-dd'
    name: string;
};

export type AttendanceRecord = {
    date: string;
    inTime: string | null;
    outTime: string | null;
    totalHours: string | null;
};

export type Staff = {
  id: string;
  name:string;
  email: string;
  mobile: string;
  whatsapp: string;
  address: string;
  department: string;
  role: string;
  salary: number;
  photoUrl: string;
  totalCasualLeaves: number;
  totalSickLeaves: number;
  attendanceRecords: AttendanceRecord[];
  skills: string[];
};

export type Task = {
    id: string;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    assignedTo: string[]; // Array of staff IDs
    tags: string[];
    createdAt: string;
}

export type Student = {
    id: string;
    name: string;
    email: string;
    className: string;
    rollNumber: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
    religion: string;
    fatherName: string;
    motherName: string;
    parentMobile: string;
    parentWhatsapp: string;
    photoUrl: string;
    attendanceRecords?: AttendanceRecord[];
};


export type Client = {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  mobile: string;
  whatsapp: string;
  plan: 'Basic' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Inactive';
  staffCount: number;
};

export type Attendance = {
    date: string;
    status: 'Present' | 'Absent' | 'Leave';
}

export type SalaryData = {
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  earnedGross: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  deductions: number;
  adjustment: number;
  netPay: number;
};

export type LeaveRequest = {
    id: string;
    employeeId: string;
    leaveType: 'Casual' | 'Sick';
    startDate: string; // ISO string
    endDate: string; // ISO string
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string; // ISO string
};

export const initialStaff: Staff[] = [
    { id: 'KM-001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', mobile: '9876543210', whatsapp: '9876543210', address: '123 Tech Park, Bangalore', department: 'Engineering', role: 'Frontend Developer', salary: 75000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['React', 'TypeScript', 'Next.js'] },
    { id: 'KM-002', name: 'Diya Patel', email: 'diya.patel@example.com', mobile: '9876543211', whatsapp: '9876543211', address: '456 Innovation Hub, Pune', department: 'Engineering', role: 'Backend Developer', salary: 85000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Node.js', 'Databases', 'API Design'] },
    { id: 'KM-003', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', mobile: '9876543212', whatsapp: '9876543212', address: '789 Business Tower, Mumbai', department: 'Product', role: 'Product Manager', salary: 95000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Product Strategy', 'Jira', 'Agile'] },
    { id: 'KM-004', name: 'Priya Singh', email: 'priya.singh@example.com', mobile: '9876543213', whatsapp: '9876543213', address: '101 Design Studio, Delhi', department: 'Design', role: 'UI/UX Designer', salary: 70000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Figma', 'UI Design', 'User Research'] },
];

const baseDate = new Date('2024-07-20T10:00:00.000Z');
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const initialTasks: Task[] = [
    { id: 'TASK-001', title: 'Design new dashboard homepage', description: 'Create a modern and intuitive design for the main dashboard homepage.', priority: 'High', dueDate: addDays(baseDate, 5).toISOString(), status: 'In Progress', assignedTo: ['KM-004'], tags: ['UI/UX', 'Design'], createdAt: baseDate.toISOString() },
    { id: 'TASK-002', title: 'Develop login API endpoint', description: 'Build and test the API endpoint for user authentication.', priority: 'High', dueDate: addDays(baseDate, 3).toISOString(), status: 'In Progress', assignedTo: ['KM-002'], tags: ['Backend', 'API'], createdAt: baseDate.toISOString() },
    { id: 'TASK-003', title: 'Implement frontend for settings page', description: 'Use React and TypeScript to build the settings page UI.', priority: 'Medium', dueDate: addDays(baseDate, 10).toISOString(), status: 'Pending', assignedTo: ['KM-001'], tags: ['Frontend', 'React'], createdAt: baseDate.toISOString() },
    { id: 'TASK-004', title: 'Conduct user research for new feature', description: 'Interview 5 target users to gather feedback on the proposed feature.', priority: 'Medium', dueDate: addDays(baseDate, 15).toISOString(), status: 'Pending', assignedTo: ['KM-003', 'KM-004'], tags: ['Research', 'Product'], createdAt: baseDate.toISOString() },
    { id: 'TASK-005', title: 'Fix bug in reporting module', description: 'The CSV export in the reporting module is failing for large datasets.', priority: 'Low', dueDate: addDays(baseDate, -1).toISOString(), status: 'Pending', assignedTo: [], tags: ['Bug', 'Backend'], createdAt: addDays(baseDate, -2).toISOString() },
    { id: 'TASK-006', title: 'Update documentation for API v2', description: 'Write and publish the updated documentation for all v2 endpoints.', priority: 'Low', dueDate: addDays(baseDate, 20).toISOString(), status: 'Completed', assignedTo: ['KM-002'], tags: ['Docs'], createdAt: addDays(baseDate, -5).toISOString() },
];


export const staff: Staff[] = [];

export const students: Student[] = [];

export const clients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '+919876543210', whatsapp: '+919876543210', plan: 'Premium', status: 'Active', staffCount: 45 },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '+919876543211', whatsapp: '+919876543211', plan: 'Basic', status: 'Active', staffCount: 12 },
    { id: 'C-103', organizationName: 'TechForward', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '+919876543212', whatsapp: '+919876543212', plan: 'Enterprise', status: 'Active', staffCount: 150 },
    { id: 'C-104', organizationName: 'NextGen Systems', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '+919876543213', whatsapp: '+919876543213', plan: 'Premium', status: 'Inactive', staffCount: 30 },
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

export const holidays: Holiday[] = [];
export const initialLeaveRequests: LeaveRequest[] = [];
