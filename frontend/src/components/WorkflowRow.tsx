import { motion } from 'framer-motion';
import { Clock, Cpu, Workflow as WorkflowIcon } from 'lucide-react';
import { Workflow } from '../types';
import { theme } from '../theme';

interface WorkflowRowProps {
  workflow: Workflow;
  onClick: () => void;
  isSelected?: boolean;
}

export const WorkflowRow: React.FC<WorkflowRowProps> = ({ 
  workflow, 
  onClick, 
  isSelected = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          background: workflow.isModule 
            ? theme.colors.accent.secondary 
            : theme.colors.accent.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.md,
          flexShrink: 0,
        }}
      >
        {workflow.isModule ? <Cpu size={16} /> : <WorkflowIcon size={16} />}
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
          {workflow.name}
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
          {workflow.description}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        {workflow.isModule && (
          <span
            style={{
              background: theme.colors.accent.secondary,
              color: theme.colors.text.primary,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.borderRadius.sm,
              fontSize: '0.7rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Module
          </span>
        )}
        
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
            {formatDate(workflow.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};