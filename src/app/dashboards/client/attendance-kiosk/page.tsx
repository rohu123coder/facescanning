
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericAttendanceKiosk } from '@/components/generic-attendance-kiosk';

import { useStudentStore } from '@/hooks/use-student-store.tsx';
import { useStudentAttendanceStore } from '@/hooks/use-student-attendance-store.tsx';
import { useStaffStore } from '@/hooks/use-staff-store.tsx';
import { useAttendanceStore } from '@/hooks/use-attendance-store.tsx';
import { type Student, type Staff } from '@/lib/data';

export default function UnifiedAttendanceKioskPage() {
    const [currentTime, setCurrentTime] = useState('');
    const [activeTab, setActiveTab] = useState('student');

    // Student Stores
    const { students, isInitialized: isStudentInitialized } = useStudentStore();
    const { attendance: studentAttendance, markAttendance: markStudentAttendance, isInitialized: isStudentAttendanceInitialized } = useStudentAttendanceStore();

    // Staff Stores
    const { staff, isInitialized: isStaffInitialized } = useStaffStore();
    const { attendance: staffAttendance, markAttendance: markStaffAttendance, isInitialized: isStaffAttendanceInitialized } = useAttendanceStore();

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(format(new Date(), 'EEEE, MMMM d, yyyy, h:mm:ss a'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Automated Attendance Kiosk</h1>
                <p className="text-muted-foreground">{currentTime}</p>
            </div>

            <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="student">Student Kiosk</TabsTrigger>
                    <TabsTrigger value="staff">Staff Kiosk</TabsTrigger>
                </TabsList>
                <TabsContent value="student" className="mt-6">
                    <GenericAttendanceKiosk<Student>
                        personType="Student"
                        persons={students}
                        isPersonsInitialized={isStudentInitialized}
                        attendance={studentAttendance}
                        isAttendanceInitialized={isStudentAttendanceInitialized}
                        markAttendance={markStudentAttendance}
                        isActive={activeTab === 'student'}
                    />
                </TabsContent>
                <TabsContent value="staff" className="mt-6">
                    <GenericAttendanceKiosk<Staff>
                        personType="Staff"
                        persons={staff}
                        isPersonsInitialized={isStaffInitialized}
                        attendance={staffAttendance}
                        isAttendanceInitialized={isStaffAttendanceInitialized}
                        markAttendance={markStaffAttendance}
                        isActive={activeTab === 'staff'}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
