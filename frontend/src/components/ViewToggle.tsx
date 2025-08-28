import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';
import { ViewMode } from '../types';
import { theme } from '../theme';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        background: theme.colors.glass.surface,
        backdropFilter: theme.blur.sm,
        borderRadius: theme.borderRadius.lg,
        padding: '2px',
        border: `1px solid ${theme.colors.glass.border}`,
      }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange('card')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
          background: viewMode === 'card' ? theme.colors.accent.primary : 'transparent',
          color: viewMode === 'card' ? theme.colors.text.primary : theme.colors.text.secondary,
          border: 'none',
          cursor: 'pointer',
          transition: `all ${theme.animation.fast}`,
        }}
      >
        <Grid size={16} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange('column')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
          background: viewMode === 'column' ? theme.colors.accent.primary : 'transparent',
          color: viewMode === 'column' ? theme.colors.text.primary : theme.colors.text.secondary,
          border: 'none',
          cursor: 'pointer',
          transition: `all ${theme.animation.fast}`,
        }}
      >
        <List size={16} />
      </motion.button>
    </div>
  );
};