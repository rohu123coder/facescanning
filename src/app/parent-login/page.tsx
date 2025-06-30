
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Mountain, Shield } from 'lucide-react';
import Link from 'next/link';
import { ClientProvider } from '@/hooks/use-client-store.tsx';
import { StudentProvider } from '@/hooks/use-student-store.tsx';
import { ParentAuthStoreProvider, useParentAuthStore } from '@/hooks/use-parent-auth-store.tsx';


const loginFormSchema = z.object({
  parentMobile: z.string().min(1, { message: "Parent's mobile number is required." }),
  rollNumber: z.string().min(1, { message: "Child's roll number is required." }),
});

function ParentLoginCore() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useParentAuthStore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            parentMobile: '',
            rollNumber: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof loginFormSchema>) => {
        setIsLoading(true);
        try {
            const result = await login(values.parentMobile, values.rollNumber);

            if (result.success) {
                toast({
                    title: 'Login Successful',
                    description: `Welcome! Viewing dashboard for ${result.studentName}.`,
                });
                window.location.assign('/dashboards/parent');
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
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-3xl font-semibold">
                    Parent Portal
                </h1>
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Parent Login</CardTitle>
                    <CardDescription>Enter your mobile number and your child's roll number.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="parentMobile"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Mobile Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 9876543210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rollNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Child's Roll Number (Password)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your child's roll number" {...field} />
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
                    <p>Not a parent? <Link href="/login" className="font-semibold text-primary hover:underline">Go to Client Login</Link></p>
                </CardFooter>
            </Card>
        </main>
    );
}


export default function ParentLoginPage() {
    // Providers are needed here to allow the auth hook to access student data across all clients
    return (
        <ClientProvider>
            <StudentProvider>
                <ParentAuthStoreProvider>
                    <ParentLoginCore />
                </ParentAuthStoreProvider>
            </StudentProvider>
        </ClientProvider>
    )
}
