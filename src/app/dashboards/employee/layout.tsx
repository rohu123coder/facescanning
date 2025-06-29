
'use client';
// This file is intentionally left blank. 
// The main layout logic has been centralized in /src/app/dashboards/layout.tsx
// to correctly handle providers for all user roles (Client, Employee, Super Admin).
// This component is kept to satisfy Next.js routing structure but delegates layout rendering to the parent.
import { type ReactNode } from "react";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
