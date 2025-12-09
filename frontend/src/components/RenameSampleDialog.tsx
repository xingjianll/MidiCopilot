import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RenameSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => void;
}

export const RenameSampleDialog: React.FC<RenameSampleDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  onConfirm,
}) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (open) {
      // Remove file extension for easier editing
      const nameWithoutExtension = currentName.replace(/\.[^/.]+$/, '');
      setNewName(nameWithoutExtension);
    }
  }, [open, currentName]);

  const handleConfirm = () => {
    if (newName.trim()) {
      onConfirm(newName.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Sample</DialogTitle>
          <DialogDescription>
            Enter a new name for "{currentName}"
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-2"
            placeholder="Enter new name"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!newName.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};