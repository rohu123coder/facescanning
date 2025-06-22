'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from './ui/badge';

interface EditClientModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client | null;
  onClientUpdated: (client: Client) => void;
}

const clientFormSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  contactName: z.string().min(2, { message: 'Contact name must be at least 2 characters.' }),
  plan: z.enum(['Basic', 'Premium', 'Enterprise'], { required_error: 'Please select a plan.' }),
  status: z.enum(['Active', 'Inactive'], { required_error: 'Please select a status.' }),
});

export function EditClientModal({ isOpen, onOpenChange, client, onClientUpdated }: EditClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
  });

  useEffect(() => {
    if (client) {
      form.reset({
        organizationName: client.organizationName,
        contactName: client.contactName,
        plan: client.plan,
        status: client.status,
      });
    }
  }, [client, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof clientFormSchema>) => {
    if (!client) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClientUpdated({
        ...client,
        ...values,
      });
      toast({
        title: 'Client Updated',
        description: `Details for ${values.organizationName} have been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update client. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Client</DialogTitle>
          <DialogDescription>
            Update client details and manage their subscription plan.
          </DialogDescription>
        </DialogHeader>
        {client && (
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
                
                <FormItem>
                    <FormLabel>Email Address (Username)</FormLabel>
                    <Input readOnly disabled value={client.email} />
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
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
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

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
                    'Save Changes'
                    )}
                </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
