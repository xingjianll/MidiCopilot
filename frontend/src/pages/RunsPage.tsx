import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ViewMode, Run } from '../types';
import { ViewToggle } from '../components/ViewToggle';
import { RunCard } from '../components/RunCard';
import { RunRow } from '../components/RunRow';
import { RunDetail } from '../components/RunDetail';
import { PageHeader } from '../components/page-header';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export const RunsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch runs from backend
  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:8000/run/');
        if (!response.ok) {
          throw new Error(`Failed to fetch runs: ${response.status}`);
        }
        const data = await response.json();

        // Transform run API response to frontend format
        const transformedRuns: Run[] = await Promise.all(
          data.map(async (runData: any) => {
            // Fetch workflow details to get workflow name
            let workflowName = runData.workflow_id ? `Workflow ${runData.workflow_id}` : 'Module Run';
            if (runData.workflow_id) {
              try {
                const workflowResponse = await fetch(`http://localhost:8000/workflow/${runData.workflow_id}`);
                if (workflowResponse.ok) {
                  const workflowData = await workflowResponse.json();
                  workflowName = workflowData.name || workflowName;
                }
              } catch (err) {
                console.warn('Failed to fetch workflow name:', err);
              }
            }

            return {
              id: runData.id.toString(),
              workflowId: runData.workflow_id ? runData.workflow_id.toString() : null,
              workflowName,
              detailedDescription: `## Run ${runData.id}\n\nExecution details for ${workflowName}\n\n### Run Information\n- **Run ID**: ${runData.id}\n- **Workflow ID**: ${runData.workflow_id}\n- **Duration**: ${runData.duration ? `${runData.duration.toFixed(2)}s` : 'N/A'}\n- **Sample ID**: ${runData.sample_id || 'None'}`,
              status: runData.duration !== null ? 'completed' : 'running',
              createdAt: runData.created_at,
              completedAt: runData.duration !== null ? runData.created_at : undefined,
              inputs: {}, // Backend doesn't return input details in list endpoint
              outputs: runData.sample_id ? { sample_id: runData.sample_id } : undefined
            };
          })
        );

        setRuns(transformedRuns);
      } catch (err: any) {
        console.error('Error fetching runs:', err);
        setError(err.message || 'Failed to fetch runs');
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  // Auto-select first run in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedRun && runs.length > 0) {
      setSelectedRun(runs[0]);
    }
  }, [viewMode, selectedRun, runs]);

  const handleRunClick = (run: Run) => {
    setSelectedRun(run);
  };

  const closeDetail = () => {
    if (viewMode === 'card') {
      setSelectedRun(null);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'card') {
      setSelectedRun(null);
    } else if (mode === 'column' && !selectedRun && runs.length > 0) {
      setSelectedRun(runs[0]);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Runs"
          actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading runs...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Runs"
          actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading runs: {error}</p>
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
      <>
        <PageHeader
          title="Runs"
          actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Column view: Split screen */}
          <div className="w-96 flex flex-col border-r">
            <div className="flex-1 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden"
              >
                {runs.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No runs available</p>
                  </div>
                ) : (
                  runs.map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      onClick={() => handleRunClick(run)}
                      isSelected={selectedRun?.id === run.id}
                    />
                  ))
                )}
              </motion.div>
            </div>
          </div>

          {/* Detail panel takes remaining space */}
          <div className="flex-1 overflow-auto p-6 bg-muted/50">
            {selectedRun && (
              <RunDetail run={selectedRun} />
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
        title="Runs"
        actions={<ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-row gap-4 w-full overflow-x-auto pb-4"
        >
          {runs.length === 0 ? (
            <div className="text-center w-full p-8 text-muted-foreground">
              <p>No runs available</p>
            </div>
          ) : (
            runs.map((run) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-w-[300px] w-[300px] flex-shrink-0"
              >
                <RunCard
                  run={run}
                  onClick={() => handleRunClick(run)}
                  isSelected={selectedRun?.id === run.id}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Sheet overlay for card view */}
      <Sheet open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <SheetContent className="w-[500px] overflow-auto">
          {selectedRun && (
            <RunDetail run={selectedRun} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};