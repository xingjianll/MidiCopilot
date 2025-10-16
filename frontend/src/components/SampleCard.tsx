import { motion } from 'framer-motion';
import { Clock, Music, Volume2, FileIcon } from 'lucide-react';
import { Sample } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface SampleCardProps {
  sample: Sample;
  onClick: () => void;
  isSelected?: boolean;
}

export const SampleCard: React.FC<SampleCardProps> = ({ 
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
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            sample.type === 'midi' ? 'bg-primary' : 'bg-secondary'
          }`}>
            <IconComponent className={`h-5 w-5 ${
              sample.type === 'midi' ? 'text-primary-foreground' : 'text-secondary-foreground'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate mb-1">
              {sample.name}
            </h3>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant={sample.type === 'midi' ? 'default' : 'secondary'} className="text-xs">
                {sample.format}
              </Badge>

              <span className="text-xs text-muted-foreground">
                {formatDuration(sample.duration)}
              </span>

              <span className="text-xs text-muted-foreground">
                {formatFileSize(sample.size)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(sample.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};