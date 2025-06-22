'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/data';
import { Loader2 } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientAdded: (client: Omit<Client, 'id'>) => void;
}

const clientFormSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  contactName: z.string().min(2, { message: 'Contact name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  whatsapp: z.string().min(10, { message: 'WhatsApp number must be at least 10 digits.' }),
  plan: z.enum(['Basic', 'Premium', 'Enterprise'], { required_error: 'Please select a plan.' }),
});

export function AddClientModal({ isOpen, onOpenChange, onClientAdded }: AddClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      organizationName: '',
      contactName: '',
      email: '',
      mobile: '',
      whatsapp: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof clientFormSchema>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClientAdded({
          ...values,
          status: 'Active',
          staffCount: 0,
          isSetupComplete: false,
          logoUrl: '',
          organizationDetails: '',
          isGbpConnected: false,
      });
      toast({
        title: 'Client Added & Credentials Generated',
        description: `Login with Email: ${values.email} and Password: ${values.mobile}`,
        duration: 9000
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add client. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Client</DialogTitle>
          <DialogDescription>
            Enter the details for the new client. Credentials will be generated and sent automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Innovatech Solutions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Rohan Mehra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (Username)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. contact@innovatech.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile (Password)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +919876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +919876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
               <Button variant="outline" onClick={handleClose} type="button" disabled={isLoading}>
                  Cancel
               </Button>
               <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add Client & Gen. Credentials'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
