import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Workflow } from '../types';
import { ViewToggle } from '../components/ViewToggle';
import { Plus, Loader2 } from 'lucide-react';
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
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [modules, setModules] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNewWorkflow = () => {
    onEditWorkflow?.('new');
  };

  // Fetch workflows and modules from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch workflows
        const workflowsResponse = await fetch('http://localhost:8000/workflow/');
        if (!workflowsResponse.ok) {
          throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`);
        }
        const workflowsData = await workflowsResponse.json();

        // Transform workflow API response to frontend format
        const transformedWorkflows: Workflow[] = workflowsData.map((item: any) => {
          const workflow = item.workflow;
          return {
            id: item.id.toString(),
            name: workflow.name,
            description: workflow.description,
            detailedDescription: workflow.description, // Use description as detailed for now
            createdAt: new Date().toISOString(), // Backend doesn't return creation date yet
            isModule: false,
            inputs: [], // TODO: Parse from workflow.nodes
            outputs: [] // TODO: Parse from workflow.nodes
          };
        });

        // Fetch modules
        const modulesResponse = await fetch('http://localhost:8000/module/');
        if (!modulesResponse.ok) {
          throw new Error(`Failed to fetch modules: ${modulesResponse.status}`);
        }
        const modulesData = await modulesResponse.json();

        // Transform module API response to frontend format
        const transformedModules: Workflow[] = modulesData.map((module: any) => {
          const inputs = Object.entries(module.inputs || {}).map(([key, type]: [string, any]) => ({
            id: key,
            name: key,
            type: type as string,
            required: true,
            description: `Input parameter of type ${type}`
          }));

          const outputs = Object.entries(module.outputs || {}).map(([key, type]: [string, any]) => ({
            id: key,
            name: key,
            type: type as string,
            description: `Output parameter of type ${type}`
          }));

          return {
            id: module.name,
            name: module.name,
            description: module.description,
            detailedDescription: module.description,
            createdAt: new Date().toISOString(),
            isModule: true,
            inputs,
            outputs
          };
        });

        setWorkflows(transformedWorkflows);
        setModules(transformedModules);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch workflows and modules');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-select first item in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedWorkflow) {
      const allItems = [...workflows, ...modules];
      if (allItems.length > 0) {
        setSelectedWorkflow(allItems[0]);
      }
    }
  }, [viewMode, selectedWorkflow, workflows, modules]);

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
      const allItems = [...workflows, ...modules];
      if (allItems.length > 0) {
        setSelectedWorkflow(allItems[0]);
      }
    }
  };

  const allItems = [...workflows, ...modules];

  if (loading) {
    return (
      <>
        <PageHeader
          title="Workflows"
          actions={<div className="flex items-center gap-2">
            <Button disabled size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Workflow
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading workflows and modules...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Workflows"
          actions={<div className="flex items-center gap-2">
            <Button onClick={handleNewWorkflow} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Workflow
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading data: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (viewMode === 'column') {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Workflows"
          actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
        />
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Column view: Split screen */}
          <div className="w-96 flex flex-col border-r">
            <div className="flex flex-col flex-1 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-auto"
              >
                {allItems.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No workflows or modules available</p>
                  </div>
                ) : (
                  allItems.map((item) => (
                    <WorkflowRow
                      key={item.id}
                      workflow={item}
                      onClick={() => handleWorkflowClick(item)}
                      isSelected={selectedWorkflow?.id === item.id}
                    />
                  ))
                )}
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
      </div>
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
          {allItems.length === 0 ? (
            <div className="text-center w-full p-8 text-muted-foreground">
              <p>No workflows or modules available</p>
            </div>
          ) : (
            allItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-w-[300px] w-[300px] flex-shrink-0"
              >
                <WorkflowCard
                  workflow={item}
                  onClick={() => handleWorkflowClick(item)}
                  isSelected={selectedWorkflow?.id === item.id}
                />
              </motion.div>
            ))
          )}
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