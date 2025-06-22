export type Staff = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  address: string;
  department: string;
  role: string;
  salary: number;
  photoUrl: string;
  attendanceStatus?: {
      date: string;
      inTime: string | null;
      outTime: string | null;
      totalHours: string | null;
  } | null;
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
    attendanceStatus?: {
        date: string;
        inTime: string | null;
        outTime: string | null;
        totalHours: string | null;
    } | null;
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
