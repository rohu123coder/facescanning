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
  name: string;
  email: string;
  department: string;
  designation: string;
  photoUrl: string;
  role: 'Admin' | 'Manager' | 'Staff';
  attendance?: AttendanceRecord[];
};

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

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // staff IDs
  dueDate: string;
  status: 'To-Do' | 'In Progress' | 'Done' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  assignedBy: string; // manager/admin name
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  staffName: string;
  staffPhotoUrl: string;
  leaveType: 'Casual' | 'Sick' | 'Earned';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type SalaryData = {
    id: string;
    staffId: string;
    month: string; // e.g., "July 2024"
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: 'Pending' | 'Paid';
};


export const initialStaff: Staff[] = [
    { id: 'S-001', name: 'Arjun Sharma', email: 'arjun.sharma@example.com', department: 'Development', designation: 'Sr. Software Engineer', photoUrl: 'https://placehold.co/100x100.png', role: 'Staff' },
    { id: 'S-002', name: 'Priya Patel', email: 'priya.patel@example.com', department: 'Human Resources', designation: 'HR Manager', photoUrl: 'https://placehold.co/100x100.png', role: 'Manager' },
    { id: 'S-003', name: 'Karan Singh', email: 'karan.singh@example.com', department: 'Design', designation: 'UI/UX Designer', photoUrl: 'https://placehold.co/100x100.png', role: 'Staff' },
];

export const initialTasks: Task[] = [
    { id: 'T-001', title: 'Develop new login page', description: 'Implement the new design for the login page using NextAuth.', assignedTo: ['S-001'], dueDate: '2024-08-15', status: 'In Progress', priority: 'High', assignedBy: 'Priya Patel' },
    { id: 'T-002', title: 'Create marketing assets for Q3', description: 'Design banners and social media posts for the upcoming campaign.', assignedTo: ['S-003'], dueDate: '2024-08-10', status: 'To-Do', priority: 'Medium', assignedBy: 'Priya Patel' },
];

export const initialClients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Enterprise', status: 'Active', staffCount: 45, isSetupComplete: true, isGbpConnected: false },
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

export const initialLeaveRequests: LeaveRequest[] = [
    { id: 'L-001', staffId: 'S-001', staffName: 'Arjun Sharma', staffPhotoUrl: 'https://placehold.co/100x100.png', leaveType: 'Casual', startDate: '2024-08-20', endDate: '2024-08-21', reason: 'Family function', status: 'Pending' },
    { id: 'L-002', staffId: 'S-003', staffName: 'Karan Singh', staffPhotoUrl: 'https://placehold.co/100x100.png', leaveType: 'Sick', startDate: '2024-08-05', endDate: '2024-08-05', reason: 'Fever', status: 'Approved' },
];
