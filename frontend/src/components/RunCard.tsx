import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader, Play } from 'lucide-react';
import { Run } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface RunCardProps {
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

export const RunCard: React.FC<RunCardProps> = ({ 
  run, 
  onClick, 
  isSelected = false 
}) => {
  const StatusIcon = statusIcons[run.status];
  const statusColor = statusColors[run.status];

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
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusBgColors[run.status]}`}>
            <StatusIcon className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate mb-1">
              {run.workflowName}
            </h3>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant={statusVariants[run.status]} className="text-xs capitalize">
                {run.status}
              </Badge>

              {getDuration() && (
                <span className="text-xs text-muted-foreground">
                  {getDuration()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(run.createdAt)} {formatTime(run.createdAt)}</span>
            </div>

            {run.error && (
              <p className="text-sm text-destructive italic mt-2">
                {run.error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};