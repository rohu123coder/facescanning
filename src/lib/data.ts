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
  role: 'Admin' | 'Employee';
  salary: number;
  photoUrl: string;
  totalCasualLeaves: number;
  totalSickLeaves: number;
  attendanceRecords: AttendanceRecord[];
  skills: string[];
};

export type Attachment = {
  name: string;
  url: string; 
  type: string; 
};

export type TaskActivity = {
  id: string;
  authorId: string;
  authorName: string;
  type: 'creation' | 'status_change' | 'comment' | 'attachment';
  text?: string;
  attachment?: Attachment;
  oldStatus?: Task['status'];
  newStatus?: Task['status'];
  createdAt: string;
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
    activity: TaskActivity[];
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
  organizationDetails: string;
  logoUrl: string;
  contactName: string;
  email: string;
  mobile: string;
  whatsapp: string;
  plan: 'Basic' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Inactive';
  staffCount: number;
  isSetupComplete: boolean;
  isGbpConnected: boolean;
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
    { id: 'KM-001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', mobile: '9876543210', whatsapp: '9876543210', address: '123 Tech Park, Bangalore', department: 'Engineering', role: 'Employee', salary: 75000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['React', 'TypeScript', 'Next.js'] },
    { id: 'KM-002', name: 'Diya Patel', email: 'diya.patel@example.com', mobile: '9876543211', whatsapp: '9876543211', address: '456 Innovation Hub, Pune', department: 'Engineering', role: 'Employee', salary: 85000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Node.js', 'Databases', 'API Design'] },
    { id: 'KM-003', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', mobile: '9876543212', whatsapp: '9876543212', address: '789 Business Tower, Mumbai', department: 'Product', role: 'Admin', salary: 95000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Product Strategy', 'Jira', 'Agile'] },
    { id: 'KM-004', name: 'Priya Singh', email: 'priya.singh@example.com', mobile: '9876543213', whatsapp: '9876543213', address: '101 Design Studio, Delhi', department: 'Design', role: 'Employee', salary: 70000, photoUrl: 'https://placehold.co/400x400.png', totalCasualLeaves: 12, totalSickLeaves: 10, attendanceRecords: [], skills: ['Figma', 'UI Design', 'User Research'] },
];

const baseDate = new Date('2024-07-25T10:00:00Z');
const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const initialTasks: Task[] = [
    { 
        id: 'TASK-001', 
        title: 'Design new dashboard homepage', 
        description: 'Create a modern and intuitive design for the main dashboard homepage. Focus on clear data visualization and easy navigation.', 
        priority: 'High', 
        dueDate: addDaysToDate(baseDate, 5).toISOString(), 
        status: 'In Progress', 
        assignedTo: ['KM-004'], 
        tags: ['UI/UX', 'Design'], 
        createdAt: baseDate.toISOString(),
        activity: [
            { id: 'ACT-001', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: addDaysToDate(baseDate, -2).toISOString() },
            { id: 'ACT-002', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'status_change', oldStatus: 'Pending', newStatus: 'In Progress', createdAt: addDaysToDate(baseDate, -1).toISOString() },
            { id: 'ACT-003', authorId: 'KM-004', authorName: 'Priya Singh', type: 'comment', text: 'Working on the initial wireframes. Will share by EOD.', createdAt: baseDate.toISOString() },
        ] 
    },
    { 
        id: 'TASK-002', 
        title: 'Develop login API endpoint', 
        description: 'Build and test the API endpoint for user authentication, including JWT generation.', 
        priority: 'High', 
        dueDate: addDaysToDate(baseDate, 3).toISOString(), 
        status: 'In Progress', 
        assignedTo: ['KM-002'], 
        tags: ['Backend', 'API'], 
        createdAt: baseDate.toISOString(),
        activity: [
            { id: 'ACT-004', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: addDaysToDate(baseDate, -1).toISOString() },
        ] 
    },
    { 
        id: 'TASK-003', 
        title: 'Implement frontend for settings page', 
        description: 'Use React and TypeScript to build the settings page UI components as per the Figma design.', 
        priority: 'Medium', 
        dueDate: addDaysToDate(baseDate, 10).toISOString(), 
        status: 'Pending', 
        assignedTo: ['KM-001'], 
        tags: ['Frontend', 'React'], 
        createdAt: baseDate.toISOString(),
        activity: [
             { id: 'ACT-005', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: baseDate.toISOString() },
        ] 
    },
    { 
        id: 'TASK-004', 
        title: 'Conduct user research for new feature', 
        description: 'Interview 5 target users to gather feedback on the proposed reporting feature.', 
        priority: 'Medium', 
        dueDate: addDaysToDate(baseDate, 15).toISOString(), 
        status: 'Pending', 
        assignedTo: ['KM-003', 'KM-004'], 
        tags: ['Research', 'Product'], 
        createdAt: baseDate.toISOString(),
        activity: [
             { id: 'ACT-006', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: baseDate.toISOString() },
        ] 
    },
    { 
        id: 'TASK-005', 
        title: 'Fix bug in reporting module', 
        description: 'The CSV export in the reporting module is failing for large datasets.', 
        priority: 'Low', 
        dueDate: addDaysToDate(baseDate, -1).toISOString(), 
        status: 'Pending', 
        assignedTo: [], 
        tags: ['Bug', 'Backend'], 
        createdAt: addDaysToDate(baseDate, -2).toISOString(),
        activity: [
            { id: 'ACT-007', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: addDaysToDate(baseDate, -2).toISOString() },
        ] 
    },
    { 
        id: 'TASK-006', 
        title: 'Update documentation for API v2', 
        description: 'Write and publish the updated documentation for all v2 endpoints on Confluence.', 
        priority: 'Low', 
        dueDate: addDaysToDate(baseDate, 20).toISOString(), 
        status: 'Completed', 
        assignedTo: ['KM-002'], 
        tags: ['Docs'], 
        createdAt: addDaysToDate(baseDate, -5).toISOString(),
        activity: [
            { id: 'ACT-008', authorId: 'KM-003', authorName: 'Rohan Mehta', type: 'creation', createdAt: addDaysToDate(baseDate, -5).toISOString() },
             { id: 'ACT-009', authorId: 'KM-002', authorName: 'Diya Patel', type: 'status_change', oldStatus: 'In Progress', newStatus: 'Completed', createdAt: addDaysToDate(baseDate, -3).toISOString() },
        ] 
    },
];


export const initialClients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Premium', status: 'Active', staffCount: 45, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', organizationDetails: 'A digital marketing agency specializing in branding and creative content.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '9876543211', whatsapp: '9876543211', plan: 'Basic', status: 'Active', staffCount: 12, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-103', organizationName: 'TechForward', organizationDetails: 'Enterprise-level software development and IT consulting services.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '9876543212', whatsapp: '9876543212', plan: 'Enterprise', status: 'Active', staffCount: 150, isSetupComplete: false, isGbpConnected: false },
    { id: 'C-104', organizationName: 'NextGen Systems', organizationDetails: 'Hardware and software solutions for the next generation of computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '9876543213', whatsapp: '9876543213', plan: 'Premium', status: 'Inactive', staffCount: 30, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-105', organizationName: 'egyan solutions', organizationDetails: 'Innovative e-learning and educational technology provider.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohit Jha', email: 'rohit.1702jha@gmail.com', mobile: '9876543214', whatsapp: '9876543214', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false },
];


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
