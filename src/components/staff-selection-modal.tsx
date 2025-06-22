'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type Staff } from '@/lib/data';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';

interface StaffSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  staffList: Staff[];
  selectedStaffIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function StaffSelectionModal({
  isOpen,
  onOpenChange,
  staffList,
  selectedStaffIds,
  onSelectionChange,
}: StaffSelectionModalProps) {
  const [internalSelection, setInternalSelection] = useState(selectedStaffIds);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInternalSelection(selectedStaffIds);
    }
  }, [isOpen, selectedStaffIds]);

  const handleToggle = (staffId: string) => {
    setInternalSelection((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSave = () => {
    onSelectionChange(internalSelection);
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
            <Input
                placeholder="Search staff by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-64 border rounded-md">
                 <div className="p-4 space-y-2">
                    {filteredStaff.length > 0 ? filteredStaff.map((staff) => (
                        <div key={staff.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                            <Checkbox
                                id={`staff-${staff.id}`}
                                checked={internalSelection.includes(staff.id)}
                                onCheckedChange={() => handleToggle(staff.id)}
                            />
                            <Label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer">
                                {staff.name}
                                <p className="text-xs text-muted-foreground">{staff.role}</p>
                            </Label>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground p-4">No staff found.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Selection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
