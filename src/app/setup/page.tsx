'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useClientStore } from '@/hooks/use-client-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mountain, Upload } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

const setupFormSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required.'),
  organizationDetails: z.string().min(10, 'Please provide a brief description of your organization.'),
  logoUrl: z.string().min(1, 'A logo is required.'),
});

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isAuthInitialized } = useAuthStore();
  const { currentClient, updateClient } = useClientStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof setupFormSchema>>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      organizationName: '',
      organizationDetails: '',
      logoUrl: '',
    },
  });
  
  const logoValue = form.watch('logoUrl');

  useEffect(() => {
    if (isAuthInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentClient?.isSetupComplete) {
        router.push('/dashboards/client');
      } else if (currentClient) {
        form.reset({
            organizationName: currentClient.organizationName,
            organizationDetails: currentClient.organizationDetails,
            logoUrl: currentClient.logoUrl
        });
      }
    }
  }, [isAuthenticated, isAuthInitialized, currentClient, router, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        form.setValue('logoUrl', dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof setupFormSchema>) => {
    if (!currentClient) return;

    setIsLoading(true);
    try {
      const updatedClientData = {
        ...currentClient,
        ...values,
        isSetupComplete: true,
      };
      await updateClient(updatedClientData);

      toast({
        title: 'Setup Complete!',
        description: `Welcome to Karma Manager, ${currentClient.organizationName}!`,
      });
      router.push('/dashboards/client');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not save organization details. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthInitialized || !currentClient) {
      return (
           <div className="flex items-center justify-center h-screen">
              <Mountain className="h-8 w-8 text-primary animate-pulse" />
          </div>
      )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Organization Setup</CardTitle>
          <CardDescription>Welcome! Let's get your organization set up on Karma Manager.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="organizationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Details</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of what your organization does." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Logo</FormLabel>
                     <FormControl>
                         <Input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                    </FormControl>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                            {logoValue ? (
                                <Image src={logoValue} alt="Logo Preview" width={96} height={96} className="object-contain rounded-md" />
                            ) : (
                                <span className="text-xs text-muted-foreground text-center">Logo Preview</span>
                            )}
                        </div>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2"/> Upload Logo
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Setup & Go to Dashboard'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
