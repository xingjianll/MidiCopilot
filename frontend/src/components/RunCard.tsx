import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader, Play } from 'lucide-react';
import { Run } from '../types';
import { theme } from '../theme';
import { GlassCard } from './GlassCard';

interface RunCardProps {
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
    <GlassCard onClick={onClick} isSelected={isSelected}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: theme.borderRadius.lg,
            background: statusColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <StatusIcon size={20} color={theme.colors.text.primary} />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              marginBottom: theme.spacing.xs,
              color: theme.colors.text.primary,
              fontSize: '1.1rem',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {run.workflowName}
          </h3>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}
          >
            <span
              style={{
                background: statusColor,
                color: theme.colors.text.primary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: '1rem',
                fontSize: '0.7rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {run.status}
            </span>
            
            {getDuration() && (
              <span
                style={{
                  color: theme.colors.text.tertiary,
                  fontSize: '0.8rem',
                }}
              >
                {getDuration()}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Clock size={14} color={theme.colors.text.tertiary} />
              <span
                style={{
                  color: theme.colors.text.tertiary,
                  fontSize: '0.8rem',
                }}
              >
                {formatDate(run.createdAt)} {formatTime(run.createdAt)}
              </span>
            </div>
          </div>

          {run.error && (
            <p
              style={{
                margin: 0,
                marginTop: theme.spacing.sm,
                color: theme.colors.accent.error,
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              {run.error}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};