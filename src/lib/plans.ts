import { type Client } from "./data";

export type Feature = 
    | 'DASHBOARD'
    | 'STUDENT_MANAGEMENT'
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
  ],
  Enterprise: [
    'DASHBOARD',
    'STUDENT_MANAGEMENT',
    'ATTENDANCE_KIOSK',
    'REPUTATION_MANAGEMENT',
  ],
};
