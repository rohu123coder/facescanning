

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
    parentWhatsapp: string;
    parentMobile: string;
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
  officeLatitude: number | null;
  officeLongitude: number | null;
  gpsRadius: number; // in meters
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
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

export type Attachment = {
    name: string;
    url: string;
    type: 'file' | 'link';
};

export type Comment = {
  id: string;
  authorId: string; // 'client-admin' or staffId
  authorName: string;
  authorImageUrl?: string;
  text: string;
  timestamp: string; // ISO string
};

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
    attachments: Attachment[];
    comments?: Comment[];
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

export type Review = {
    id: string;
    reviewerName: string;
    reviewerImageUrl: string;
    rating: number; // 1 to 5
    text: string;
    relativeTimeDescription: string;
};


export const initialClients: Client[] = [
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: 'https://placehold.co/400x400.png', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', organizationDetails: 'A digital marketing agency specializing in branding and creative content.', logoUrl: 'https://placehold.co/400x400.png', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '9876543211', whatsapp: '9876543211', plan: 'Basic', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-103', organizationName: 'TechForward', organizationDetails: 'Enterprise-level software development and IT consulting services.', logoUrl: 'https://placehold.co/400x400.png', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '9876543212', whatsapp: '9876543212', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: true, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-104', organizationName: 'NextGen Systems', organizationDetails: 'Hardware and software solutions for the next generation of computing.', logoUrl: 'https://placehold.co/400x400.png', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '9876543213', whatsapp: '9876543213', plan: 'Premium', status: 'Inactive', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-105', organizationName: 'eGyan Solutions', organizationDetails: 'Innovative e-learning and educational technology provider.', logoUrl: 'https://placehold.co/400x400.png', contactName: 'Rohit Jha', email: 'rohit.1702jha@gmail.com', mobile: '9876543214', whatsapp: '9876543214', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: true, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
];

export const initialReviews: Review[] = [
    {
        id: 'R-001',
        reviewerName: 'Aakash Gupta',
        reviewerImageUrl: 'https://placehold.co/100x100.png',
        rating: 5,
        text: 'An absolutely wonderful experience from start to finish. The staff was incredibly welcoming, and the service was impeccable. Highly recommended!',
        relativeTimeDescription: '2 days ago',
    },
    {
        id: 'R-002',
        reviewerName: 'Neha Singh',
        reviewerImageUrl: 'https://placehold.co/100x100.png',
        rating: 2,
        text: 'I was really disappointed with my visit. The waiting time was too long, and the main course was cold when it arrived. I expected much better for the price.',
        relativeTimeDescription: '5 days ago',
    },
    {
        id: 'R-003',
        reviewerName: 'Vikram Choudhary',
        reviewerImageUrl: 'https://placehold.co/100x100.png',
        rating: 4,
        text: 'A great place! The atmosphere is lovely and the food is quite good. The service could be a little faster during peak hours, but overall, a very positive experience.',
        relativeTimeDescription: 'a week ago',
    },
    {
        id: 'R-004',
        reviewerName: 'Sunita Patel',
        reviewerImageUrl: 'https://placehold.co/100x100.png',
        rating: 1,
        text: 'Terrible. Just terrible. The order was completely wrong, and the staff was rude when I pointed it out. Will not be returning.',
        relativeTimeDescription: '2 weeks ago',
    },
];

// --- SAMPLE DATA FOR A NEW CLIENT ---

export const initialStaff: Staff[] = [
  { id: '5001', name: 'Arjun Sharma', email: 'arjun.sharma@example.com', mobile: '9876511111', password: 'password123', whatsapp: '9876511111', address: '123 Tech Park, Bangalore', department: 'Engineering', role: 'Senior Developer', salary: 120000, annualCasualLeaves: 12, annualSickLeaves: 6, joiningDate: '2022-08-15T00:00:00.000Z', status: 'Active', photoUrl: 'https://placehold.co/400x400.png' },
  { id: '5002', name: 'Priya Patel', email: 'priya.patel@example.com', mobile: '9876522222', password: 'password123', whatsapp: '9876522222', address: '456 Innovation Hub, Pune', department: 'Marketing', role: 'Marketing Head', salary: 95000, annualCasualLeaves: 12, annualSickLeaves: 6, joiningDate: '2023-01-20T00:00:00.000Z', status: 'Active', photoUrl: 'https://placehold.co/400x400.png' },
  { id: '5003', name: 'Rahul Verma', email: 'rahul.verma@example.com', mobile: '9876533333', password: 'password123', whatsapp: '9876533333', address: '789 Business Center, Mumbai', department: 'Sales', role: 'Sales Executive', salary: 60000, annualCasualLeaves: 12, annualSickLeaves: 6, joiningDate: '2023-05-10T00:00:00.000Z', status: 'Active', photoUrl: 'https://placehold.co/400x400.png' },
];

export const initialStudents: Student[] = [
    { id: 'STU-101', name: 'Aarav Gupta', email: 'aarav.g@example.com', className: 'Grade 5', rollNumber: 'A-501', gender: 'Male', dob: '2014-05-20T00:00:00.000Z', religion: 'Hinduism', fatherName: 'Rajesh Gupta', motherName: 'Sunita Gupta', parentMobile: '9123456780', parentWhatsapp: '9123456780', photoUrl: 'https://placehold.co/400x400.png', status: 'Active', joiningDate: '2023-04-01T00:00:00.000Z' },
    { id: 'STU-102', name: 'Isha Singh', email: 'isha.s@example.com', className: 'Grade 5', rollNumber: 'A-502', gender: 'Female', dob: '2014-07-11T00:00:00.000Z', religion: 'Hinduism', fatherName: 'Vikram Singh', motherName: 'Pooja Singh', parentMobile: '9123456781', parentWhatsapp: '9123456781', photoUrl: 'https://placehold.co/400x400.png', status: 'Active', joiningDate: '2023-04-01T00:00:00.000Z' },
    { id: 'STU-103', name: 'Rohan Mehra', email: 'rohan.m@example.com', className: 'Grade 6', rollNumber: 'B-601', gender: 'Male', dob: '2013-02-15T00:00:00.000Z', religion: 'Hinduism', fatherName: 'Anil Mehra', motherName: 'Kavita Mehra', parentMobile: '9123456782', parentWhatsapp: '9123456782', photoUrl: 'https://placehold.co/400x400.png', status: 'Active', joiningDate: '2023-04-01T00:00:00.000Z' }
];

export const initialTasks: Task[] = [
    { id: 'T-1', title: 'Finalize Q3 Marketing Budget', description: 'Review the proposed budget from the marketing team and provide final approval. Focus on digital ad spend.', status: 'To Do', priority: 'High', category: 'Finance', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), assignedTo: ['5002'], attachments: [], comments: [] },
    { id: 'T-2', title: 'Develop User Authentication Module', description: 'Build and test the new user login and registration flow. Ensure password encryption is implemented.', status: 'In Progress', priority: 'Urgent', category: 'Development', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), assignedTo: ['5001'], attachments: [], comments: [] },
    { id: 'T-3', title: 'Client Follow-up Calls', description: 'Call the list of new leads from last week to schedule demos.', status: 'To Do', priority: 'Medium', category: 'Sales', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), assignedTo: ['5003'], attachments: [], comments: [] },
    { id: 'T-4', title: 'Deploy Staging Server Updates', description: 'Push the latest build from the dev branch to the staging server for QA testing.', status: 'Done', priority: 'High', category: 'DevOps', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), assignedTo: ['5001'], attachments: [], comments: [] },
];

export const initialLeaves: LeaveRequest[] = [
    { id: 'L-1', staffId: '5003', leaveType: 'Casual', startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Personal work', status: 'Approved', requestDate: new Date().toISOString() }
];

export const initialHolidays: Holiday[] = [
    { id: 'H-1', date: `${new Date().getFullYear()}-10-02`, name: 'Gandhi Jayanti' },
    { id: 'H-2', date: `${new Date().getFullYear()}-12-25`, name: 'Christmas Day' }
];

export const initialAttendance: Attendance[] = [
    { personId: '5001', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], inTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(), outTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { personId: '5002', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], inTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8.5 * 60 * 60 * 1000).toISOString(), outTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { personId: 'STU-101', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], inTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 7 * 60 * 60 * 1000).toISOString(), outTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString() },
];
