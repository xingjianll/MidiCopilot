import { motion } from 'framer-motion';
import { Music, Volume2, Clock, HardDrive, FileIcon, Play, Download } from 'lucide-react';
import { Sample } from '../types';
import { theme } from '../theme';

interface SampleDetailProps {
  sample: Sample;
}

export const SampleDetail: React.FC<SampleDetailProps> = ({ sample }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.lg,
            background: sample.type === 'midi' 
              ? theme.colors.accent.primary 
              : theme.colors.accent.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={24} />
        </div>
        
        <div>
          <h1
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            {sample.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            <Clock size={14} color={theme.colors.text.tertiary} />
            <span style={{ color: theme.colors.text.tertiary, fontSize: '0.9rem' }}>
              Created {formatDate(sample.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: theme.colors.accent.primary,
            color: theme.colors.text.primary,
            border: 'none',
            borderRadius: theme.borderRadius.lg,
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          <Play size={16} />
          Play
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: theme.colors.surface,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          <Download size={16} />
          Download
        </motion.button>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          Properties
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <span style={{ color: theme.colors.text.secondary }}>Type</span>
            <span
              style={{
                background: sample.type === 'midi' 
                  ? theme.colors.accent.primary 
                  : theme.colors.accent.secondary,
                color: theme.colors.text.primary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: '0.8rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {sample.type}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <span style={{ color: theme.colors.text.secondary }}>Format</span>
            <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
              {sample.format}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <span style={{ color: theme.colors.text.secondary }}>Duration</span>
            <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
              {formatDuration(sample.duration)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <span style={{ color: theme.colors.text.secondary }}>File Size</span>
            <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
              {formatFileSize(sample.size)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.md,
            color: theme.colors.text.primary,
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          {sample.type === 'midi' ? 'Piano Roll' : 'Waveform'}
        </h3>
        <div
          style={{
            padding: theme.spacing.xl,
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <p style={{ color: theme.colors.text.secondary, fontSize: '1.1rem' }}>
            {sample.type === 'midi' ? 'Piano roll visualization will be implemented here' : 'Audio waveform will be displayed here'}
          </p>
        </div>
      </div>
    </div>
  );
};