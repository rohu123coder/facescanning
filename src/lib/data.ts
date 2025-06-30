

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
    { id: 'C-101', organizationName: 'Innovatech Solutions', organizationDetails: 'Leading the charge in AI-driven business solutions and cloud computing.', logoUrl: '', contactName: 'Rohan Mehra', email: 'contact@innovatech.com', mobile: '9876543210', whatsapp: '9876543210', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-102', organizationName: 'Creative Minds Inc.', organizationDetails: 'A digital marketing agency specializing in branding and creative content.', logoUrl: '', contactName: 'Priya Sharma', email: 'hello@creativeminds.co', mobile: '9876543211', whatsapp: '9876543211', plan: 'Basic', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-103', organizationName: 'TechForward', organizationDetails: 'Enterprise-level software development and IT consulting services.', logoUrl: '', contactName: 'Amit Singh', email: 'support@techforward.io', mobile: '9876543212', whatsapp: '9876543212', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: true, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-104', organizationName: 'NextGen Systems', organizationDetails: 'Hardware and software solutions for the next generation of computing.', logoUrl: '', contactName: 'Sunita Patil', email: 'admin@nextgen.com', mobile: '9876543213', whatsapp: '9876543213', plan: 'Premium', status: 'Inactive', staffCount: 0, isSetupComplete: false, isGbpConnected: false, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
    { id: 'C-105', organizationName: 'egyan solutions', organizationDetails: 'Innovative e-learning and educational technology provider.', logoUrl: '', contactName: 'Rohit Jha', email: 'rohit.1702jha@gmail.com', mobile: '9876543214', whatsapp: '9876543214', plan: 'Enterprise', status: 'Active', staffCount: 0, isSetupComplete: false, isGbpConnected: true, officeLatitude: null, officeLongitude: null, gpsRadius: 50 },
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


// All initial data arrays are now empty to ensure a fresh start for every client.
export const initialHolidays: Holiday[] = [];
export const initialStudents: Student[] = [];
export const initialStaff: Staff[] = [];
export const initialLeaves: LeaveRequest[] = [];
export const initialTasks: Task[] = [];
export const initialAttendance: Attendance[] = [];
