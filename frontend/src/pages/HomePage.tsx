import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Workflow } from '../types';
import { mockWorkflows } from '../mockData';
import { ViewToggle } from '../components/ViewToggle';
import { Plus } from 'lucide-react';
import { WorkflowCard } from '../components/WorkflowCard';
import { WorkflowRow } from '../components/WorkflowRow';
import { WorkflowDetail } from '../components/WorkflowDetail';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { PageHeader } from '../components/page-header';

interface HomePageProps {
  onEditWorkflow?: (workflowId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onEditWorkflow }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleNewWorkflow = () => {
    onEditWorkflow?.('new');
  };

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
      <>
        <PageHeader
          title="Workflows"
          actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Column view: Split screen */}
          <div className="w-96 flex flex-col border-r">
            <div className="flex flex-col flex-1 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-auto"
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

              {/* New Workflow Button at bottom */}
              <div className="p-4 border-t">
                <Button
                  onClick={handleNewWorkflow}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Workflow
                </Button>
              </div>
            </div>
          </div>

          {/* Detail panel takes remaining space */}
          <div className="flex-1 overflow-auto p-6 bg-muted/50">
            {selectedWorkflow && (
              <WorkflowDetail workflow={selectedWorkflow} onEdit={onEditWorkflow} />
            )}
          </div>
        </div>
      </>
    );
  }

  // Card view: Full screen with overlay drawer
  return (
    <>
      <PageHeader
        title="Workflows"
        actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-row gap-4 w-full overflow-x-auto pb-4 flex-1"
        >
          {mockWorkflows.map((workflow) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="min-w-[300px] w-[300px] flex-shrink-0"
            >
              <WorkflowCard
                workflow={workflow}
                onClick={() => handleWorkflowClick(workflow)}
                isSelected={selectedWorkflow?.id === workflow.id}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* New Workflow Button at bottom */}
        <div className="flex justify-center">
          <Button
            onClick={handleNewWorkflow}
            size="lg"
            className="min-w-[200px]"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Sheet overlay for card view - using shadcn Sheet component */}
      <Sheet open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <SheetContent className="w-[500px] overflow-auto">
          {selectedWorkflow && (
            <WorkflowDetail
              workflow={selectedWorkflow}
              onClose={closeDetail}
              onEdit={onEditWorkflow}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};