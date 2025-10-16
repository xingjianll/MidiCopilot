import { Grid, List } from 'lucide-react';
import { ViewMode } from '../types';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value) onViewModeChange(value as ViewMode);
      }}
      className="bg-muted p-1"
    >
      <ToggleGroupItem
        value="card"
        aria-label="Card view"
        size="sm"
      >
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="column"
        aria-label="List view"
        size="sm"
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};