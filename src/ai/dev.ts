'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/face-scan-attendance.ts';
import '@/ai/flows/generate-review-reply.ts';

