import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Clock, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useWebSocket } from '../hooks/useWebSocket';

interface RunStatus {
  run_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  message?: string;
  startTime: number;
}


export const QueueStatusWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRuns, setActiveRuns] = useState<Map<number, RunStatus>>(new Map());
  const { lastMessage } = useWebSocket('ws://localhost:8000/ws');

  // Handle WebSocket messages to update run status
  useEffect(() => {
    if (lastMessage) {
      const runId = lastMessage.run_id;
      
      setActiveRuns(prev => {
        const newMap = new Map(prev);
        
        if (lastMessage.type === 'run_progress') {
          // Update or add running status
          const existing = newMap.get(runId);
          newMap.set(runId, {
            run_id: runId,
            status: 'running',
            progress: {
              current: lastMessage.current || 0,
              total: lastMessage.total || 0,
              percentage: lastMessage.percentage || 0,
            },
            message: lastMessage.message,
            startTime: existing?.startTime || Date.now(),
          });
        } else if (lastMessage.type === 'run_complete' || lastMessage.type === 'run_failed') {
          // Remove completed/failed runs after a brief delay
          setTimeout(() => {
            setActiveRuns(current => {
              const updated = new Map(current);
              updated.delete(runId);
              return updated;
            });
          }, 3000);
          
          // Update status temporarily
          const existing = newMap.get(runId);
          if (existing) {
            newMap.set(runId, {
              ...existing,
              status: lastMessage.type === 'run_complete' ? 'completed' : 'failed',
              message: lastMessage.message,
            });
          }
        }
        
        return newMap;
      });
    }
  }, [lastMessage]);


  const formatDuration = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getStatusIcon = (status: RunStatus['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <div className="h-4 w-4 rounded-full bg-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: RunStatus['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const totalRunCount = activeRuns.size;

  return (
    <motion.div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
    >
      {!isExpanded ? (
        // Collapsed circular widget
        <div
          className="relative cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105">
            {totalRunCount > 0 ? (
              <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
            ) : (
              <Clock className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          {/* Queue count badge */}
          {totalRunCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-background">
              {totalRunCount}
            </div>
          )}
        </div>
      ) : (
        // Expanded detailed view
        <Card className="shadow-lg border border-border w-80">
          <CardContent className="p-0">
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium text-sm">
                  Queue Status ({totalRunCount})
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="border-t border-border max-h-96 overflow-y-auto">
              {totalRunCount === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No active runs
                </div>
              ) : (
                Array.from(activeRuns.values()).map((run) => (
                  <div
                    key={run.run_id}
                    className="p-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className="text-sm font-medium">
                          Run #{run.run_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(run.status)}`}
                        >
                          {run.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(run.startTime)}
                        </span>
                      </div>
                    </div>

                    {run.progress && run.status === 'running' && (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round(run.progress.percentage)}%
                          </span>
                        </div>
                        <Progress value={run.progress.percentage} className="h-1.5 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{run.progress.current} / {run.progress.total} tokens</span>
                        </div>
                      </>
                    )}

                    {run.message && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {run.message}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};