'use client';

import { useState, useEffect } from 'react';
import { useStaffStore } from '@/hooks/use-staff-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface StaffSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectStaff: (staffIds: string[]) => void;
  initialSelectedIds?: string[];
}

export function StaffSelectionModal({ isOpen, onOpenChange, onSelectStaff, initialSelectedIds = [] }: StaffSelectionModalProps) {
  const { staff, isInitialized } = useStaffStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const handleToggleStaff = (staffId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onSelectStaff(Array.from(selectedIds));
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Select Staff Member(s)</DialogTitle>
            <DialogDescription>
                Search by name and select one or more staff members to assign the task to.
            </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border">
          <CommandInput placeholder="Search staff..." />
          <CommandList>
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {isInitialized && staff.map(member => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => handleToggleStaff(member.id)}
                  className="flex items-center gap-4"
                >
                  <Checkbox checked={selectedIds.has(member.id)} className="pointer-events-none" />
                  <Avatar>
                    <AvatarImage src={member.photoUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
