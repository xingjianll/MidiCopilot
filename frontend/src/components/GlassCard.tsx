import { motion } from 'framer-motion';
import { theme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  onClick, 
  className = '', 
  isSelected = false 
}) => {
  return (
    <motion.div
      className={`glass-card ${className}`}
      onClick={onClick}
      whileHover={{ opacity: 0.8 }}
      whileTap={{ opacity: 0.9 }}
      style={{
        background: isSelected ? theme.colors.surfaceActive : theme.colors.glass.surface,
        backdropFilter: theme.blur.md,
        border: `1px solid ${theme.colors.glass.border}`,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${theme.animation.normal}`,
      }}
    >
      {children}
    </motion.div>
  );
};