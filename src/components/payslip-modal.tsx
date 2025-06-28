'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { type Staff } from '@/lib/data';
import { Printer } from 'lucide-react';
import Image from 'next/image';
import { useClientStore } from '@/hooks/use-client-store';
import { type PayslipData } from '@/app/dashboards/client/salary/page';

interface PayslipModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  payslipData: PayslipData | null;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function PayslipModal({ isOpen, onOpenChange, payslipData }: PayslipModalProps) {
  const { currentClient } = useClientStore();

  const handlePrint = () => {
    window.print();
  };
  
  if (!payslipData || !currentClient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-6 pb-0 print-hide">
            <DialogTitle className="font-headline">
              Payslip for {payslipData.staff.name} - {payslipData.month} {payslipData.year}
            </DialogTitle>
            <DialogDescription>
              This is the generated payslip. You can print it or close the dialog.
            </DialogDescription>
          </DialogHeader>
          <div id="payslip-content" className="p-8 text-black bg-white">
            <header className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                {currentClient.logoUrl && <Image src={currentClient.logoUrl} alt="Company Logo" width={64} height={64} className="rounded-md" data-ai-hint="logo"/>}
                <div>
                  <h1 className="text-2xl font-bold font-headline">{currentClient.organizationName}</h1>
                  <p className="text-sm">{currentClient.organizationDetails}</p>
                </div>
              </div>
              <h2 className="text-3xl font-bold font-headline text-gray-700">Payslip</h2>
            </header>
            
            <section className="grid grid-cols-2 gap-8 mt-6 text-sm">
                <div>
                    <p><span className="font-semibold">Employee Name:</span> {payslipData.staff.name}</p>
                    <p><span className="font-semibold">Employee ID:</span> {payslipData.staff.id}</p>
                    <p><span className="font-semibold">Designation:</span> {payslipData.staff.role}</p>
                    <p><span className="font-semibold">Department:</span> {payslipData.staff.department}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Payslip for:</span> {payslipData.month} {payslipData.year}</p>
                    <p><span className="font-semibold">Working Days:</span> {payslipData.totalWorkingDays}</p>
                    <p><span className="font-semibold">Days Present:</span> {payslipData.daysPresent}</p>
                    <p><span className="font-semibold">LOP Days:</span> {payslipData.lopDays}</p>
                </div>
            </section>
            
            <Separator className="my-6 bg-gray-200" />

            <section className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold mb-2 underline">Earnings</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <p>Basic Salary</p>
                            <p>{currencyFormatter.format(payslipData.earnings.basic)}</p>
                        </div>
                         <div className="flex justify-between">
                            <p>House Rent Allowance (HRA)</p>
                            <p>{currencyFormatter.format(payslipData.earnings.hra)}</p>
                        </div>
                         <div className="flex justify-between">
                            <p>Special Allowance</p>
                            <p>{currencyFormatter.format(payslipData.earnings.specialAllowance)}</p>
                        </div>
                    </div>
                     <Separator className="my-2 bg-gray-200" />
                     <div className="flex justify-between font-bold">
                        <p>Total Earnings</p>
                        <p>{currencyFormatter.format(payslipData.earnings.total)}</p>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-bold mb-2 underline">Deductions</h3>
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <p>Loss of Pay (LOP)</p>
                            <p className="text-red-600">-{currencyFormatter.format(payslipData.deductions.lop)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p>Standard Deduction</p>
                            <p className="text-red-600">-{currencyFormatter.format(payslipData.deductions.standard)}</p>
                        </div>
                    </div>
                    <Separator className="my-2 bg-gray-200" />
                     <div className="flex justify-between font-bold">
                        <p>Total Deductions</p>
                        <p className="text-red-600">-{currencyFormatter.format(payslipData.deductions.standard + payslipData.deductions.lop)}</p>
                    </div>
                </div>
            </section>
            
            <Separator className="my-6 bg-gray-200" />

            <section className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-bold">Net Salary</h3>
                <p className="text-xl font-bold">{currencyFormatter.format(payslipData.netSalary)}</p>
            </section>

             <footer className="mt-8 text-center text-xs text-gray-500">
                <p>This is a computer-generated payslip and does not require a signature.</p>
                <p>{currentClient.organizationName}</p>
            </footer>
          </div>
          <DialogFooter className="p-4 border-t print-hide">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handlePrint}><Printer className="mr-2"/>Print Payslip</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
