import { type Client } from "./data";

export type Feature = 
    | 'DASHBOARD'
    | 'STUDENT_MANAGEMENT'
    | 'ATTENDANCE_KIOSK'
    | 'REPUTATION_MANAGEMENT'
    | 'STAFF_MANAGEMENT'
    | 'TASK_MANAGEMENT'
    | 'LEAVE_MANAGEMENT'
    | 'SALARY_MANAGEMENT';

export const planFeatures: Record<Client['plan'], Feature[]> = {
  Basic: [
    'DASHBOARD',
    'ATTENDANCE_KIOSK',
    'STUDENT_MANAGEMENT'
  ],
  Premium: [
    'DASHBOARD',
    'ATTENDANCE_KIOSK',
    'STUDENT_MANAGEMENT',
    'REPUTATION_MANAGEMENT'
  ],
  Enterprise: [
    'DASHBOARD',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'REPUTATION_MANAGEMENT',
  ],
};
