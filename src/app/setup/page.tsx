

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useClientStore } from '@/hooks/use-client-store.tsx';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mountain, Upload, LocateFixed } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const setupFormSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required.'),
  organizationDetails: z.string().min(10, 'Please provide a brief description of your organization.'),
  logoUrl: z.string().min(1, 'A logo is required.'),
  officeLatitude: z.number().nullable(),
  officeLongitude: z.number().nullable(),
  gpsRadius: z.coerce.number().min(10, 'Radius must be at least 10 meters.'),
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
      officeLatitude: null,
      officeLongitude: null,
      gpsRadius: 50,
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
            logoUrl: currentClient.logoUrl,
            officeLatitude: currentClient.officeLatitude,
            officeLongitude: currentClient.officeLongitude,
            gpsRadius: currentClient.gpsRadius
        });
      }
    }
  }, [isAuthenticated, isAuthInitialized, currentClient, router, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setIsLoading(true);
        try {
             const compressedDataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    if (!event.target?.result) {
                        return reject(new Error("FileReader did not return a result."));
                    }
                    const img = document.createElement('img');
                    img.src = event.target.result as string;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxWidth = 400; // Max width for the logo
                        const scaleSize = maxWidth / img.width;
                        canvas.width = maxWidth;
                        canvas.height = img.height * scaleSize;
                        
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            return reject(new Error('Could not get canvas context'));
                        }
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        resolve(ctx.canvas.toDataURL('image/jpeg', 0.8)); // 80% quality
                    };
                    img.onerror = (error) => reject(error);
                };
                reader.onerror = (error) => reject(error);
            });
            form.setValue('logoUrl', compressedDataUri, { shouldValidate: true });
        } catch (error) {
             console.error("Image compression failed", error);
            toast({
                variant: 'destructive',
                title: 'Image Error',
                description: 'Could not process the image. Please try another one.',
            });
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleSetLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            form.setValue('officeLatitude', position.coords.latitude);
            form.setValue('officeLongitude', position.coords.longitude);
            toast({ title: 'Location Set!', description: 'Office GPS coordinates have been captured.' });
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            toast({ variant: 'destructive', title: 'GPS Error', description: 'Could not get location. Please enable permissions.' });
            setIsLoading(false);
        });
    } else {
        toast({ variant: 'destructive', title: 'GPS Not Supported', description: 'Your browser does not support geolocation.' });
        setIsLoading(false);
    }
  }


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
                                <Image src={logoValue} alt="Logo Preview" width={96} height={96} className="object-contain rounded-md" data-ai-hint="logo"/>
                            ) : (
                                <span className="text-xs text-muted-foreground text-center">Logo Preview</span>
                            )}
                        </div>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                             Upload Logo
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
               <div>
                  <h3 className="text-lg font-medium">GPS Attendance Settings</h3>
                  <p className="text-sm text-muted-foreground">Set your primary office location for GPS-based attendance.</p>
               </div>

                <Button type="button" variant="outline" onClick={handleSetLocation} disabled={isLoading} className="w-full">
                    <LocateFixed className="mr-2"/>
                    {isLoading ? 'Getting Location...' : 'Get & Set Current Office Location'}
                </Button>

                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="officeLatitude"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Office Latitude</FormLabel>
                            <FormControl><Input disabled {...field} value={field.value ?? ''} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="officeLongitude"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Office Longitude</FormLabel>
                            <FormControl><Input disabled {...field} value={field.value ?? ''} /></FormControl>
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="gpsRadius"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Allowed Radius (in meters)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />


              <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Setup & Go to Dashboard'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
