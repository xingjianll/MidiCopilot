import { motion } from 'framer-motion';
import { Clock, Cpu, Workflow as WorkflowIcon } from 'lucide-react';
import { Workflow } from '../types';
import { theme } from '../theme';
import { GlassCard } from './GlassCard';

interface WorkflowCardProps {
  workflow: Workflow;
  onClick: () => void;
  isSelected?: boolean;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  workflow, 
  onClick, 
  isSelected = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <GlassCard onClick={onClick} isSelected={isSelected}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: theme.borderRadius.lg,
            background: workflow.isModule 
              ? theme.colors.accent.secondary 
              : theme.colors.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {workflow.isModule ? <Cpu size={20} /> : <WorkflowIcon size={20} />}
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
            {workflow.name}
          </h3>
          
          <p
            style={{
              margin: 0,
              marginBottom: theme.spacing.sm,
              color: theme.colors.text.secondary,
              fontSize: '0.9rem',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {workflow.description}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Clock size={14} color={theme.colors.text.tertiary} />
              <span
                style={{
                  color: theme.colors.text.tertiary,
                  fontSize: '0.8rem',
                }}
              >
                {formatDate(workflow.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};