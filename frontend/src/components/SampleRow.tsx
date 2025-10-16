import { motion } from 'framer-motion';
import { Clock, Music, Volume2 } from 'lucide-react';
import { Sample } from '../types';
import { Badge } from './ui/badge';

interface SampleRowProps {
  sample: Sample;
  onClick: () => void;
  isSelected?: boolean;
}

export const SampleRow: React.FC<SampleRowProps> = ({ 
  sample, 
  onClick, 
  isSelected = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = () => {
    return sample.type === 'midi' ? Music : Volume2;
  };

  const IconComponent = getIcon();

  return (
    <div
      className={`flex items-center p-4 cursor-pointer border-b transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${
        sample.type === 'midi' ? 'bg-primary' : 'bg-secondary'
      }`}>
        <IconComponent className={`h-4 w-4 ${
          sample.type === 'midi' ? 'text-primary-foreground' : 'text-secondary-foreground'
        }`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {sample.name}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {sample.format} • {formatDuration(sample.duration)} • {formatFileSize(sample.size)}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={sample.type === 'midi' ? 'default' : 'secondary'} className="text-xs uppercase">
          {sample.type}
        </Badge>

        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[80px] text-right">
          <Clock className="h-3 w-3" />
          <span>{formatDate(sample.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};