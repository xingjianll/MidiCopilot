import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ViewMode, Run } from '../types';
import { mockRuns } from '../mockData';
import { ViewToggle } from '../components/ViewToggle';
import { RunCard } from '../components/RunCard';
import { RunRow } from '../components/RunRow';
import { RunDetail } from '../components/RunDetail';
import { PageHeader } from '../components/page-header';
import { Sheet, SheetContent } from '../components/ui/sheet';

export const RunsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  // Auto-select first run in column view
  useEffect(() => {
    if (viewMode === 'column' && !selectedRun) {
      setSelectedRun(mockRuns[0]);
    }
  }, [viewMode, selectedRun]);

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
    } else if (mode === 'column' && !selectedRun) {
      setSelectedRun(mockRuns[0]);
    }
  };

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
                {mockRuns.map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    onClick={() => handleRunClick(run)}
                    isSelected={selectedRun?.id === run.id}
                  />
                ))}
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
          {mockRuns.map((run) => (
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
          ))}
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