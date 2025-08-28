import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { theme } from '../theme';

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title 
}) => {
  const drawerVariants = {
    closed: { 
      y: '100%',
      opacity: 0
    },
    open: { 
      y: 0,
      opacity: 1
    }
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.colors.glass.backdrop,
              zIndex: 40,
            }}
          />
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60vh',
              background: theme.colors.glass.surface,
              backdropFilter: theme.blur.md,
              borderTop: `1px solid ${theme.colors.glass.border}`,
              borderTopLeftRadius: theme.borderRadius.xl,
              borderTopRightRadius: theme.borderRadius.xl,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 50,
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
        </>
      )}
    </AnimatePresence>
  );
};