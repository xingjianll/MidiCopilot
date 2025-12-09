import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Run } from '../types';
import { Badge } from './ui/badge';

interface RunRowProps {
  run: Run;
  onClick: () => void;
  isSelected?: boolean;
}

const statusVariants = {
  pending: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
} as const;

const statusBgColors = {
  pending: 'bg-secondary',
  running: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-destructive',
};

const statusIcons = {
  pending: Clock,
  running: Loader,
  completed: CheckCircle,
  failed: XCircle,
};

export const RunRow: React.FC<RunRowProps> = ({ 
  run, 
  onClick, 
  isSelected = false 
}) => {
  const StatusIcon = statusIcons[run.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = () => {
    if (!run.completedAt) return null;
    const start = new Date(run.createdAt);
    const end = new Date(run.completedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    return `${duration}s`;
  };

  return (
    <div
      className={`flex items-center p-4 cursor-pointer border-b transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${statusBgColors[run.status]}`}>
        <StatusIcon className="h-4 w-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {run.workflowName}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {run.error || `Run ${run.id.slice(0, 8)}`}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={statusVariants[run.status]} className="text-xs capitalize">
          {run.status}
        </Badge>

        {getDuration() && (
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">
            {getDuration()}
          </span>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[120px] text-right">
          <Clock className="h-3 w-3" />
          <span>{formatDate(run.createdAt)} {formatTime(run.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};