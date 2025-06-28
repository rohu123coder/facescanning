'use client';

import { useStaffStore } from '@/hooks/use-staff-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface StaffSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectStaff: (staffId: string) => void;
}

export function StaffSelectionModal({ isOpen, onOpenChange, onSelectStaff }: StaffSelectionModalProps) {
  const { staff, isInitialized } = useStaffStore();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Select a staff member</DialogTitle>
            <DialogDescription>
                Search by name and select a staff member to assign the task to.
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
                  onSelect={() => onSelectStaff(member.id)}
                  className="flex items-center gap-4 cursor-pointer"
                >
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
      </DialogContent>
    </Dialog>
  );
}
