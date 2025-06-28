
import { type Client } from "./data";

export type Feature = 
    | 'DASHBOARD'
    | 'STAFF_MANAGEMENT'
    | 'STUDENT_MANAGEMENT'
    | 'ATTENDANCE_KIOSK'
    | 'LEAVE_MANAGEMENT'
    | 'SALARY_AUTOMATION'
    | 'TASK_MANAGEMENT'
    | 'REPUTATION_MANAGEMENT'
    | 'HOLIDAY_MANAGEMENT';

export const planFeatures: Record<Client['plan'], Feature[]> = {
  Basic: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
  ],
  Premium: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'TASK_MANAGEMENT',
  ],
  Enterprise: [
    'DASHBOARD',
    'STAFF_MANAGEMENT',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'LEAVE_MANAGEMENT',
    'SALARY_AUTOMATION',
    'TASK_MANAGEMENT',
    'REPUTATION_MANAGEMENT',
    'HOLIDAY_MANAGEMENT',
  ],
};
