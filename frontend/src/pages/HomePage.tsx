import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Workflow } from '../types';
import { mockWorkflows } from '../mockData';
import { theme } from '../theme';
import { ViewToggle } from '../components/ViewToggle';
import { WorkflowCard } from '../components/WorkflowCard';
import { WorkflowRow } from '../components/WorkflowRow';
import { WorkflowDetail } from '../components/WorkflowDetail';

export const HomePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Auto-select first workflow in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedWorkflow) {
      setSelectedWorkflow(mockWorkflows[0]);
    }
  }, [viewMode, selectedWorkflow]);

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  const closeDetail = () => {
    if (viewMode === 'card') {
      setSelectedWorkflow(null);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'card') {
      setSelectedWorkflow(null);
    } else if (mode === 'column' && !selectedWorkflow) {
      setSelectedWorkflow(mockWorkflows[0]);
    }
  };

  if (viewMode === 'column') {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Column view: Split screen */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: theme.colors.glass.surface,
              backdropFilter: theme.blur.sm,
            }}
          >
            <h1
              style={{
                margin: 0,
                color: theme.colors.text.primary,
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              Workflows
            </h1>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                overflow: 'hidden',
              }}
            >
              {mockWorkflows.map((workflow) => (
                <WorkflowRow
                  key={workflow.id}
                  workflow={workflow}
                  onClick={() => handleWorkflowClick(workflow)}
                  isSelected={selectedWorkflow?.id === workflow.id}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Detail panel takes remaining space */}
        <div style={{ flex: 1, background: theme.colors.background, overflow: 'auto', padding: theme.spacing.xl }}>
          {selectedWorkflow && (
            <WorkflowDetail workflow={selectedWorkflow} />
          )}
        </div>
      </div>
    );
  }

  // Card view: Full screen with overlay drawer
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: theme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            Workflows
          </h1>
          <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: `${theme.spacing.lg} 0 ${theme.spacing.lg} ${theme.spacing.lg}` }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: theme.spacing.lg,
              width: '100%',
              overflowX: 'auto',
              padding: '0 0 1rem 0',
            }}
          >
            {mockWorkflows.map((workflow) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ minWidth: '300px', width: '300px', flexShrink: 0 }}
              >
                <WorkflowCard
                  workflow={workflow}
                  onClick={() => handleWorkflowClick(workflow)}
                  isSelected={selectedWorkflow?.id === workflow.id}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Overlay drawer for card view */}
      <AnimatePresence>
        {selectedWorkflow && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetail}
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
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '500px',
                height: '100vh',
                background: theme.colors.glass.surface,
                backdropFilter: theme.blur.md,
                zIndex: 50,
                overflow: 'auto',
                padding: theme.spacing.xl,
              }}
            >
              <WorkflowDetail workflow={selectedWorkflow} onClose={closeDetail} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};