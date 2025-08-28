import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Run } from '../types';
import { theme } from '../theme';

interface RunRowProps {
  run: Run;
  onClick: () => void;
  isSelected?: boolean;
}

const statusColors = {
  pending: theme.colors.text.tertiary,
  running: theme.colors.accent.warning,
  completed: theme.colors.accent.success,
  failed: theme.colors.accent.error,
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
    <motion.div
      whileHover={{ backgroundColor: theme.colors.surfaceHover }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.md,
        cursor: 'pointer',
        backgroundColor: isSelected ? theme.colors.surfaceActive : 'transparent',
        borderBottom: `1px solid ${theme.colors.border}`,
        transition: `all ${theme.animation.fast}`,
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: theme.borderRadius.md,
          background: statusColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.md,
          flexShrink: 0,
        }}
      >
        <StatusIcon size={16} color={theme.colors.text.primary} />
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: theme.colors.text.primary,
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {run.workflowName}
        </div>
        <div
          style={{
            color: theme.colors.text.secondary,
            fontSize: '0.9rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {run.error || `Run ${run.id.slice(0, 8)}`}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        
        {getDuration() && (
          <span
            style={{
              color: theme.colors.text.tertiary,
              fontSize: '0.8rem',
              minWidth: '40px',
              textAlign: 'right',
            }}
          >
            {getDuration()}
          </span>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <Clock size={14} color={theme.colors.text.tertiary} />
          <span
            style={{
              color: theme.colors.text.tertiary,
              fontSize: '0.8rem',
              minWidth: '120px',
              textAlign: 'right',
            }}
          >
            {formatDate(run.createdAt)} {formatTime(run.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};