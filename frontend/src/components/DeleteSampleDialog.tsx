import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface DeleteSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleName: string;
  onConfirm: (deleteFile: boolean) => void;
}

export const DeleteSampleDialog: React.FC<DeleteSampleDialogProps> = ({
  open,
  onOpenChange,
  sampleName,
  onConfirm,
}) => {
  // Load the preference from sessionStorage on component mount
  const [deleteFile, setDeleteFile] = React.useState(() => {
    const stored = sessionStorage.getItem('deleteFileFromDisk');
    return stored === 'true';
  });

  // Update sessionStorage whenever the checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    setDeleteFile(checked);
    sessionStorage.setItem('deleteFileFromDisk', checked.toString());
  };

  const handleConfirm = () => {
    onConfirm(deleteFile);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sample</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{sampleName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="delete-file"
              checked={deleteFile}
              onCheckedChange={(checked) => handleCheckboxChange(checked as boolean)}
            />
            <Label
              htmlFor="delete-file"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Also delete the file from disk
            </Label>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};