
export type Holiday = {
    id: string;
    date: string; // ISO string for date 'yyyy-MM-dd'
    name: string;
};

export type Student = {
    id: string;
    name: string;
    email: string;
    className: string;
    rollNumber: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string; // ISO String
    religion: string;
    fatherName: string;
    motherName: string;
    parentMobile: string;
    parentWhatsapp: string;
    photoUrl: string;
    status: 'Active' | 'Inactive';
    joiningDate: string; // ISO string
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
  personId: string; // Can be staffId or studentId
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
    assignedTo: string[]; // Staff IDs
};

export type SalaryRules = {
  offDays: ("0"|"1"|"2"|"3"|"4"|"5"|"6")[]; // 0 for Sunday, 6 for Saturday
  basic: number; // percentage
  hra: number; // percentage
  standardDeduction: number; // percentage
};

export type SalarySlipData = {
    id: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    month: string;
    year: string;
    totalDays: number;
    workingDays: number;
    paidDays: number;
    lopDays: number;
    grossSalary: number;
    earnedBasic: number;
    earnedHra: number;
    earnedSpecialAllowance: number;
    totalEarnings: number;
    lopDeduction: number;
    standardDeduction: number;
    totalDeductions: number;
    netSalary: number;
}


export const initialClients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Enterprise', status: 'Active', staffCount: 45, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', organizationDetails: 'A digital marketing agency specializing in branding and creative content.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '9876543211', whatsapp: '9876543211', plan: 'Basic', status: 'Active', staffCount: 12, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-103', organizationName: 'TechForward', organizationDetails: 'Enterprise-level software development and IT consulting services.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '9876543212', whatsapp: '9876543212', plan: 'Enterprise', status: 'Active', staffCount: 150, isSetupComplete: false, isGbpConnected: false },
    { id: 'C-104', organizationName: 'NextGen Systems', organizationDetails: 'Hardware and software solutions for the next generation of computing.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '9876543213', whatsapp: '9876543213', plan: 'Premium', status: 'Inactive', staffCount: 30, isSetupComplete: true, isGbpConnected: false },
    { id: 'C-105', organizationName: 'egyan solutions', organizationDetails: 'Innovative e-learning and educational technology provider.', logoUrl: 'https://placehold.co/100x100.png', contactName: 'Rohit Jha', email: 'rohit.1702jha@gmail.com', mobile: '9876543214', whatsapp: '9876543214', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false },
];

export const initialHolidays: Holiday[] = [];

export const initialStudents: Student[] = [
    {
        id: 'STU-001',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        className: '10 A',
        rollNumber: '21',
        gender: 'Male',
        dob: '2008-05-15T00:00:00.000Z',
        religion: 'Hinduism',
        fatherName: 'Manish Sharma',
        motherName: 'Sunita Sharma',
        parentMobile: '9876543210',
        parentWhatsapp: '9876543210',
        photoUrl: 'https://placehold.co/200x200.png',
        status: 'Active',
        joiningDate: new Date().toISOString()
    },
    {
        id: 'STU-002',
        name: 'Diya Patel',
        email: 'diya.patel@example.com',
        className: '9 B',
        rollNumber: '15',
        gender: 'Female',
        dob: '2009-08-22T00:00:00.000Z',
        religion: 'Hinduism',
        fatherName: 'Rajesh Patel',
        motherName: 'Priya Patel',
        parentMobile: '9876543211',
        parentWhatsapp: '9876543211',
        photoUrl: 'https://placehold.co/200x200.png',
        status: 'Active',
        joiningDate: new Date().toISOString()
    }
];

export const initialStaff: Staff[] = [
    {
        id: 'S-001',
        name: 'Rohan Mehra',
        email: 'rohan.mehra@example.com',
        mobile: '9876543210',
        whatsapp: '9876543210',
        address: '123 Tech Park, Bangalore',
        department: 'Engineering',
        role: 'Senior Developer',
        salary: 80000,
        annualCasualLeaves: 12,
        annualSickLeaves: 7,
        joiningDate: '2022-01-15T00:00:00.000Z',
        status: 'Active',
        photoUrl: 'https://placehold.co/200x200.png'
    },
    {
        id: 'S-002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        mobile: '9876543211',
        whatsapp: '9876543211',
        address: '456 Marketing Ave, Mumbai',
        department: 'Marketing',
        role: 'Marketing Head',
        salary: 95000,
        annualCasualLeaves: 15,
        annualSickLeaves: 10,
        joiningDate: '2021-11-20T00:00:00.000Z',
        status: 'Active',
        photoUrl: 'https://placehold.co/200x200.png'
    }
];
export const initialLeaves: LeaveRequest[] = [];
export const initialTasks: Task[] = [];
export const initialAttendance: Attendance[] = [];
