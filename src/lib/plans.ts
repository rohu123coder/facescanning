import { type Client } from "./data";

export type Feature = 
    | 'DASHBOARD'
    | 'STUDENT_MANAGEMENT'
    | 'TASK_MANAGEMENT'
    | 'LEAVE_MANAGEMENT'
    | 'SALARY_MANAGEMENT'
    | 'ATTENDANCE_KIOSK'
    | 'REPUTATION_MANAGEMENT';

export const planFeatures: Record<Client['plan'], Feature[]> = {
  Basic: [
    'DASHBOARD',
    'ATTENDANCE_KIOSK',
  ],
  Premium: [
    'DASHBOARD',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'SALARY_MANAGEMENT',
    'TASK_MANAGEMENT',
  ],
  Enterprise: [
    'DASHBOARD',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'SALARY_MANAGEMENT',
    'TASK_MANAGEMENT',
    'REPUTATION_MANAGEMENT',
  ],
};
