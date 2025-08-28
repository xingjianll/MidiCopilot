import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { theme } from '../theme';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  isColumn?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  isColumn = false 
}) => {
  const panelVariants = {
    closed: { 
      x: isColumn ? 0 : '100%',
      opacity: isColumn ? 0 : 1,
      width: isColumn ? 0 : '400px'
    },
    open: { 
      x: 0,
      opacity: 1,
      width: isColumn ? '400px' : '400px'
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={panelVariants}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            height: '100vh',
            background: theme.colors.glass.surface,
            backdropFilter: theme.blur.md,
            borderLeft: `1px solid ${theme.colors.glass.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.glass.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                margin: 0,
                color: theme.colors.text.primary,
                fontSize: '1.25rem',
                fontWeight: '600',
              }}
            >
              {title}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                padding: theme.spacing.xs,
                borderRadius: theme.borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </motion.button>
          </div>
          <div
            style={{
              flex: 1,
              padding: theme.spacing.lg,
              overflow: 'auto',
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};