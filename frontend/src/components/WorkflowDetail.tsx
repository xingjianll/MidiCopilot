import { motion } from 'framer-motion';
import { Play, Edit, Clock, Cpu, Workflow as WorkflowIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Workflow } from '../types';
import { theme } from '../theme';

interface WorkflowDetailProps {
  workflow: Workflow;
  onClose?: () => void;
  onEdit?: (workflowId: string) => void;
}

export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflow, onClose, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </motion.button>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.lg,
            background: workflow.isModule 
              ? theme.colors.accent.secondary 
              : theme.colors.accent.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {workflow.isModule ? <Cpu size={24} /> : <WorkflowIcon size={24} />}
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
            {workflow.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            <Clock size={14} color={theme.colors.text.tertiary} />
            <span style={{ color: theme.colors.text.tertiary, fontSize: '0.9rem' }}>
              Created {formatDate(workflow.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          color: theme.colors.text.secondary,
          lineHeight: '1.6',
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 style={{ color: theme.colors.text.primary, fontSize: '1.5rem', marginBottom: theme.spacing.md }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ color: theme.colors.text.primary, fontSize: '1.25rem', marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ color: theme.colors.text.primary, fontSize: '1.1rem', marginBottom: theme.spacing.sm, marginTop: theme.spacing.md }}>{children}</h3>
            ),
            p: ({ children }) => (
              <p style={{ color: theme.colors.text.secondary, marginBottom: theme.spacing.sm, lineHeight: '1.6' }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul style={{ color: theme.colors.text.secondary, paddingLeft: theme.spacing.lg, marginBottom: theme.spacing.sm }}>{children}</ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: theme.spacing.xs }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ color: theme.colors.text.primary, fontWeight: '600' }}>{children}</strong>
            ),
            code: ({ children }) => (
              <code style={{ 
                background: theme.colors.surface, 
                padding: '2px 4px', 
                fontSize: '0.9em', 
                color: theme.colors.accent.primary 
              }}>{children}</code>
            ),
          }}
        >
          {workflow.detailedDescription}
        </ReactMarkdown>
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
          Run
        </motion.button>
        
        {!workflow.isModule && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit?.(workflow.id)}
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
            <Edit size={16} />
            Edit
          </motion.button>
        )}
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
          Inputs
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {workflow.inputs.map((input) => (
            <div
              key={input.id}
              style={{
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
                  {input.name}
                </span>
                <span
                  style={{
                    background: theme.colors.accent.primary,
                    color: theme.colors.text.primary,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.7rem',
                    fontWeight: '500',
                  }}
                >
                  {input.type}
                </span>
                {input.required && (
                  <span
                    style={{
                      background: theme.colors.accent.warning,
                      color: theme.colors.text.primary,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.7rem',
                      fontWeight: '500',
                    }}
                  >
                    Required
                  </span>
                )}
              </div>
              {input.description && (
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                  }}
                >
                  {input.description}
                </p>
              )}
            </div>
          ))}
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
          Outputs
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {workflow.outputs.map((output) => (
            <div
              key={output.id}
              style={{
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <span style={{ color: theme.colors.text.primary, fontWeight: '500' }}>
                  {output.name}
                </span>
                <span
                  style={{
                    background: theme.colors.accent.success,
                    color: theme.colors.text.primary,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.7rem',
                    fontWeight: '500',
                  }}
                >
                  {output.type}
                </span>
              </div>
              {output.description && (
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.text.secondary,
                    fontSize: '0.9rem',
                  }}
                >
                  {output.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};