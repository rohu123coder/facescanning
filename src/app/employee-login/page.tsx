
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmployeeAuthStore } from '@/hooks/use-employee-auth-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Mountain } from 'lucide-react';
import Link from 'next/link';
import { ClientProvider } from '@/hooks/use-client-store.tsx';
import { StaffProvider } from '@/hooks/use-staff-store.tsx';
import { EmployeeAuthStoreProvider } from '@/hooks/use-employee-auth-store';

const loginFormSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee ID is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

function EmployeeLoginCore() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useEmployeeAuthStore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
        employeeId: '',
        password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof loginFormSchema>) => {
        setIsLoading(true);
        try {
            const result = await login(values.employeeId, values.password);

            if (result.success) {
                toast({
                    title: 'Login Successful',
                    description: 'Welcome back!',
                });
                window.location.assign('/dashboards/employee');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: result.message || 'Invalid credentials.',
                });
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'An Error Occurred',
                description: 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
                <Mountain className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-3xl font-semibold">
                Karma Manager
                </h1>
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader>
                <CardTitle className="text-2xl font-headline">Employee Login</CardTitle>
                <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <FormControl>
                            <Input placeholder="Your Employee ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
                    </Button>
                    </form>
                </Form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm">
                    <p>Not an employee? <Link href="/login" className="font-semibold text-primary hover:underline">Go to Client Login</Link></p>
                </CardFooter>
            </Card>
        </main>
    );
}


export default function EmployeeLoginPage() {
    // Providers are needed here to allow the auth hook to access staff data across all clients
    return (
        <ClientProvider>
            <StaffProvider>
                <EmployeeAuthStoreProvider>
                    <EmployeeLoginCore />
                </EmployeeAuthStoreProvider>
            </StaffProvider>
        </ClientProvider>
    )
}
