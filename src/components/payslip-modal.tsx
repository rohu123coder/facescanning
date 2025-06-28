
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useClientStore } from '@/hooks/use-client-store';
import { type SalarySlipData } from '@/lib/data';
import Image from 'next/image';

interface PayslipModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  slipData: SalarySlipData | null;
}

export function PayslipModal({ isOpen, onOpenChange, slipData }: PayslipModalProps) {
  const { currentClient } = useClientStore();

  if (!slipData || !currentClient) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div id="payslip-content" className="p-8">
            <DialogHeader className="print-hide">
                <DialogTitle>Salary Slip</DialogTitle>
                <DialogDescription>
                    Salary slip for {slipData.staffName} for {slipData.month}, {slipData.year}.
                </DialogDescription>
            </DialogHeader>
            <header className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-4">
                <Image src={currentClient.logoUrl} alt="Logo" width={64} height={64} className="rounded-md" data-ai-hint="logo" />
                <div>
                    <h1 className="text-2xl font-bold font-headline">{currentClient.organizationName}</h1>
                    <p className="text-muted-foreground">{currentClient.organizationDetails}</p>
                </div>
                </div>
                <div className="text-right">
                <h2 className="text-xl font-semibold">Payslip</h2>
                <p className="text-muted-foreground">{slipData.month} {slipData.year}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                <div>
                    <h3 className="font-semibold mb-2">Employee Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="font-medium">Employee Name:</span>
                        <span>{slipData.staffName}</span>
                        <span className="font-medium">Designation:</span>
                        <span>{slipData.staffRole}</span>
                        <span className="font-medium">Staff ID:</span>
                        <span>{slipData.staffId}</span>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Salary Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="font-medium">Total Days:</span>
                        <span>{slipData.totalDays}</span>
                         <span className="font-medium">Working Days:</span>
                        <span>{slipData.workingDays}</span>
                        <span className="font-medium">Paid Days:</span>
                        <span>{slipData.paidDays}</span>
                         <span className="font-medium">LOP Days:</span>
                        <span className="text-destructive">{slipData.lopDays}</span>
                    </div>
                </div>
            </section>
            
            <Separator />
            
            <section className="grid grid-cols-2 gap-8 my-6">
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Earnings</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Basic Salary</span> <span>₹{slipData.earnedBasic.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>House Rent Allowance (HRA)</span> <span>₹{slipData.earnedHra.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Special Allowance</span> <span>₹{slipData.earnedSpecialAllowance.toFixed(2)}</span></div>
                    </div>
                 </div>
                 <div>
                    <h3 className="font-semibold text-lg mb-2">Deductions</h3>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Loss of Pay</span> <span>₹{slipData.lopDeduction.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Standard Deduction</span> <span>₹{slipData.standardDeduction.toFixed(2)}</span></div>
                    </div>
                 </div>
            </section>

            <Separator />

             <section className="grid grid-cols-2 gap-8 my-6 font-semibold">
                 <div className="flex justify-between"><span>Total Earnings</span> <span>₹{slipData.totalEarnings.toFixed(2)}</span></div>
                 <div className="flex justify-between"><span>Total Deductions</span> <span>₹{slipData.totalDeductions.toFixed(2)}</span></div>
            </section>

            <Separator />

            <section className="mt-6 p-4 bg-muted rounded-md text-center">
                 <h3 className="text-lg font-bold">Net Salary</h3>
                 <p className="text-2xl font-bold font-mono text-primary">₹{slipData.netSalary.toFixed(2)}</p>
            </section>
            
             <footer className="mt-8 text-center text-xs text-muted-foreground">
                <p>This is a computer-generated payslip and does not require a signature.</p>
            </footer>

        </div>
        <DialogFooter className="print-hide">
            <Button variant="outline" onClick={handlePrint}>Print Payslip</Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
