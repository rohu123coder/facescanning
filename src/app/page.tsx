'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Gem, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';

const roles = [
  {
    name: 'Client Login',
    description: 'Access your organization\'s dashboard to manage staff, tasks, and salaries.',
    href: '/login',
    icon: <Briefcase className="h-8 w-8 text-primary" />,
  },
  {
    name: 'Super Admin',
    description: 'Manage clients, subscriptions, and platform-wide settings.',
    href: '/dashboards/super-admin/login',
    icon: <Gem className="h-8 w-8 text-primary" />,
  },
];

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-primary mb-4 tracking-tight font-headline">
          Karma Manager
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          An intelligent platform for your entire organization. Please select a portal to proceed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {roles.map((role) => (
          <Card key={role.name} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out group bg-card">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              {role.icon}
              <CardTitle className="text-2xl font-headline">{role.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-[160px]">
              <p className="text-muted-foreground pt-2">{role.description}</p>
              <Button asChild className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={role.href}>
                  Proceed <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
       <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>Karma Manager &copy; {currentYear}. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
