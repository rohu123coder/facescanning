
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Mountain } from 'lucide-react';


export default function AccountDeletionPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleDeleteData = () => {
        setIsLoading(true);
        try {
            // This is a simple but effective way to clear all data for a PWA
            // that relies on localStorage.
            localStorage.clear();

            toast({
                title: 'Data Deleted',
                description: 'All your account data has been removed from this browser. You have been logged out.',
            });

            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (error) {
            console.error("Failed to delete data:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete data. Please try clearing your browser cache manually.',
            });
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
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                         <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 font-headline">Account & Data Deletion</CardTitle>
                    <CardDescription>
                        Request the deletion of your account and associated data stored in this browser.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-md text-sm bg-muted/50">
                        <h3 className="font-semibold flex items-center gap-2"><ShieldCheck /> How Your Data is Stored</h3>
                        <p className="text-muted-foreground mt-2">
                           Karma Manager is a Progressive Web App (PWA) that stores all your data—including your account details, staff lists, tasks, etc.—directly and securely in your web browser's local storage. We do not have a central server that holds your personal data.
                        </p>
                         <p className="text-muted-foreground mt-2">
                           Clicking the button below will permanently remove all of this data from your current browser, effectively deleting your account on this device. This action cannot be undone.
                        </p>
                    </div>

                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isLoading}>
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2" />}
                                Delete All My Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete all Karma Manager data from this browser, including all accounts (Client, Employee, Parent) that you have logged into. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={handleDeleteData}
                            >
                                Yes, delete everything
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </CardContent>
            </Card>
        </main>
    );
}
