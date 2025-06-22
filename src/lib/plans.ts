import { type Client } from "./data";

export type Feature = 
    | 'DASHBOARD'
    | 'STAFF_MANAGEMENT'
    | 'STUDENT_MANAGEMENT'
    | 'TASK_MANAGEMENT'
    | 'LEAVE_MANAGEMENT'
    | 'SALARY_MANAGEMENT'
    | 'ATTENDANCE_KIOSK';

export const planFeatures: Record<Client['plan'], Feature[]> = {
  Basic: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'ATTENDANCE_KIOSK',
  ],
  Premium: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'SALARY_MANAGEMENT',
    'TASK_MANAGEMENT',
  ],
  Enterprise: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'SALARY_MANAGEMENT',
    'TASK_MANAGEMENT',
  ],
};
