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
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Search } from 'lucide-react';

interface StaffSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectStaff: (staffIds: string[]) => void;
  initialSelectedIds?: string[];
}

export function StaffSelectionModal({ isOpen, onOpenChange, onSelectStaff, initialSelectedIds = [] }: StaffSelectionModalProps) {
  const { staff, isInitialized } = useStaffStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      setSearchTerm('');
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

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
            <DialogDescription>
                Select one or more staff members to assign the task to.
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search staff by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-2 space-y-1">
                {isInitialized && filteredStaff.length > 0 ? (
                    filteredStaff.map(member => (
                    <div
                        key={member.id}
                        onClick={() => handleToggleStaff(member.id)}
                        className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-accent"
                    >
                        <Checkbox checked={selectedIds.has(member.id)} readOnly />
                        <Avatar>
                        <AvatarImage src={member.photoUrl} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        {isInitialized ? 'No staff found.' : 'Loading staff...'}
                    </p>
                )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Save Selection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
