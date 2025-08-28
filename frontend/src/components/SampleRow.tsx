import { motion } from 'framer-motion';
import { Clock, Music, Volume2 } from 'lucide-react';
import { Sample } from '../types';
import { theme } from '../theme';

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
          background: sample.type === 'midi' 
            ? theme.colors.accent.primary 
            : theme.colors.accent.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.md,
          flexShrink: 0,
        }}
      >
        <IconComponent size={16} />
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
          {sample.name}
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
          {sample.format} • {formatDuration(sample.duration)} • {formatFileSize(sample.size)}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <span
          style={{
            background: sample.type === 'midi' 
              ? theme.colors.accent.primary 
              : theme.colors.accent.secondary,
            color: theme.colors.text.primary,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.sm,
            fontSize: '0.7rem',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {sample.type}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <Clock size={14} color={theme.colors.text.tertiary} />
          <span
            style={{
              color: theme.colors.text.tertiary,
              fontSize: '0.8rem',
              minWidth: '80px',
              textAlign: 'right',
            }}
          >
            {formatDate(sample.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};