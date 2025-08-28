import { motion } from 'framer-motion';
import { Clock, Music, Volume2, FileIcon } from 'lucide-react';
import { Sample } from '../types';
import { theme } from '../theme';
import { GlassCard } from './GlassCard';

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
    <GlassCard onClick={onClick} isSelected={isSelected}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: theme.borderRadius.lg,
            background: sample.type === 'midi' 
              ? theme.colors.accent.primary 
              : theme.colors.accent.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} />
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
            {sample.name}
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
                background: sample.type === 'midi' 
                  ? theme.colors.accent.primary 
                  : theme.colors.accent.secondary,
                color: theme.colors.text.primary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: '1rem',
                fontSize: '0.7rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {sample.format}
            </span>
            
            <span
              style={{
                color: theme.colors.text.secondary,
                fontSize: '0.8rem',
              }}
            >
              {formatDuration(sample.duration)}
            </span>
            
            <span
              style={{
                color: theme.colors.text.tertiary,
                fontSize: '0.8rem',
              }}
            >
              {formatFileSize(sample.size)}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <Clock size={14} color={theme.colors.text.tertiary} />
            <span
              style={{
                color: theme.colors.text.tertiary,
                fontSize: '0.8rem',
              }}
            >
              {formatDate(sample.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};