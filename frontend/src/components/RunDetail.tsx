import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Clock, Eye, Code } from 'lucide-react';
import { Run } from '../types';
import { theme } from '../theme';

interface RunDetailProps {
  run: Run;
}

const statusColors = {
  pending: theme.colors.text.tertiary,
  running: theme.colors.accent.warning,
  completed: theme.colors.accent.success,
  failed: theme.colors.accent.error,
};

const statusIcons = {
  pending: Clock,
  running: Loader,
  completed: CheckCircle,
  failed: XCircle,
};

export const RunDetail: React.FC<RunDetailProps> = ({ run }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph'>('overview');
  const StatusIcon = statusIcons[run.status];
  const statusColor = statusColors[run.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    if (!run.completedAt) return null;
    const start = new Date(run.createdAt);
    const end = new Date(run.completedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    return `${duration} seconds`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'graph', label: 'Graph', icon: Code },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: theme.borderRadius.lg,
            background: statusColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StatusIcon size={24} color={theme.colors.text.primary} />
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
            {run.workflowName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
            <span
              style={{
                background: statusColor,
                color: theme.colors.text.primary,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.sm,
                fontSize: '0.7rem',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {run.status}
            </span>
            <span style={{ color: theme.colors.text.tertiary, fontSize: '0.9rem' }}>
              Run {run.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ backgroundColor: theme.colors.surfaceHover }}
              onClick={() => setActiveTab(tab.id as 'overview' | 'graph')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2px solid ${theme.colors.accent.primary}` : '2px solid transparent',
                color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                cursor: 'pointer',
                fontWeight: isActive ? '500' : 'normal',
                transition: `all ${theme.animation.fast}`,
              }}
            >
              <TabIcon size={16} />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {activeTab === 'overview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <div>
            <h3
              style={{
                margin: 0,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                fontSize: '1.1rem',
                fontWeight: '600',
              }}
            >
              Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.colors.text.secondary }}>Started</span>
                <span style={{ color: theme.colors.text.primary }}>{formatDate(run.createdAt)}</span>
              </div>
              {run.completedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.colors.text.secondary }}>Completed</span>
                  <span style={{ color: theme.colors.text.primary }}>{formatDate(run.completedAt)}</span>
                </div>
              )}
              {getDuration() && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.colors.text.secondary }}>Duration</span>
                  <span style={{ color: theme.colors.text.primary }}>{getDuration()}</span>
                </div>
              )}
            </div>
          </div>

          {run.error && (
            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: theme.spacing.sm,
                  color: theme.colors.accent.error,
                  fontSize: '1.1rem',
                  fontWeight: '600',
                }}
              >
                Error
              </h3>
              <div
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.surface,
                  borderLeft: `4px solid ${theme.colors.accent.error}`,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.text.primary,
                    fontFamily: 'monospace',
                  }}
                >
                  {run.error}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3
              style={{
                margin: 0,
                marginBottom: theme.spacing.sm,
                color: theme.colors.text.primary,
                fontSize: '1.1rem',
                fontWeight: '600',
              }}
            >
              Inputs
            </h3>
            <div
              style={{
                padding: theme.spacing.md,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <pre
                style={{
                  margin: 0,
                  color: theme.colors.text.primary,
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(run.inputs, null, 2)}
              </pre>
            </div>
          </div>

          {run.outputs && (
            <div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: theme.spacing.sm,
                  color: theme.colors.text.primary,
                  fontSize: '1.1rem',
                  fontWeight: '600',
                }}
              >
                Outputs
              </h3>
              <div
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    color: theme.colors.text.primary,
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(run.outputs, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: theme.spacing.xl,
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
          }}
        >
          <p style={{ color: theme.colors.text.secondary, fontSize: '1.1rem' }}>
            Graph visualization will be implemented here
          </p>
        </div>
      )}
    </div>
  );
};