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
  contactName:string;
  email: string;
  mobile: string;
  whatsapp: string;
  plan: 'Basic' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Inactive';
  staffCount: number;
  isSetupComplete: boolean;
  isGbpConnected: boolean;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  address: string;
  department: 'Sales' | 'Marketing' | 'Engineering' | 'HR' | 'Support';
  role: string;
  salary: number;
  annualCasualLeaves: number;
  annualSickLeaves: number;
  joiningDate: string; // ISO string
  status: 'Active' | 'Inactive';
  photoUrl: string;
};

export type Attendance = {
  staffId: string;
  date: string; // 'YYYY-MM-DD'
  inTime: string | null; // ISO string
  outTime: string | null; // ISO string
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  leaveType: 'Casual' | 'Sick';
  startDate: string; // ISO string date
  endDate: string; // ISO string date
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string; // ISO string
};

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Task = {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: string;
    dueDate: string; // ISO string date
    createdAt: string; // ISO string
    assignedTo: string | null; // Staff ID
};

export const initialClients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Enterprise', status: 'Active', staffCount: 45, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', organizationDetails: 'A digital marketing agency specializing in branding and creative content.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '9876543211', whatsapp: '9876543211', plan: 'Basic', status: 'Active', staffCount: 12, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-103', organizationName: 'TechForward', organizationDetails: 'Enterprise-level software development and IT consulting services.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '9876543212', whatsapp: '9876543212', plan: 'Enterprise', status: 'Active', staffCount: 150, isSetupComplete: false, isGbpConnected: false },
    { id: 'C-104', organizationName: 'NextGen Systems', organizationDetails: 'Hardware and software solutions for the next generation of computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '9876543213', whatsapp: '9876543213', plan: 'Premium', status: 'Inactive', staffCount: 30, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-105', organizationName: 'egyan solutions', organizationDetails: 'Innovative e-learning and educational technology provider.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohit Jha', email: 'rohit.1702jha@gmail.com', mobile: '9876543214', whatsapp: '9876543214', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false },
];

export const holidays: Holiday[] = [];

export const initialStaff: Staff[] = [];

export const initialLeaves: LeaveRequest[] = [
    {
        id: 'L-1',
        staffId: 'S-001',
        leaveType: 'Casual',
        startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString(),
        reason: 'Family function in another city.',
        status: 'Pending',
        requestDate: new Date().toISOString()
    },
    {
        id: 'L-2',
        staffId: 'S-002',
        leaveType: 'Sick',
        startDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        reason: 'Fever and cold.',
        status: 'Approved',
        requestDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString()
    },
     {
        id: 'L-3',
        staffId: 'S-003',
        leaveType: 'Casual',
        startDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(),
        reason: 'Personal work.',
        status: 'Rejected',
        requestDate: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString()
    }
];

export const initialTasks: Task[] = [];
