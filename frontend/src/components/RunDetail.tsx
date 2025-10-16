import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Clock, Eye, Code } from 'lucide-react';
import { Run } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RunDetailProps {
  run: Run;
}

const statusVariants = {
  pending: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
} as const;

const statusBgColors = {
  pending: 'bg-secondary',
  running: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-destructive',
};

const statusIcons = {
  pending: Clock,
  running: Loader,
  completed: CheckCircle,
  failed: XCircle,
};

export const RunDetail: React.FC<RunDetailProps> = ({ run }) => {
  const StatusIcon = statusIcons[run.status];

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusBgColors[run.status]}`}>
          <StatusIcon className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {run.workflowName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[run.status]} className="text-xs capitalize">
              {run.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Run {run.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="graph" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Graph
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{formatDate(run.createdAt)}</span>
                </div>
                {run.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{formatDate(run.completedAt)}</span>
                  </div>
                )}
                {getDuration() && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{getDuration()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {run.error && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-destructive">Error</h3>
                <div className="p-3 bg-muted border-l-4 border-destructive rounded">
                  <p className="font-mono text-sm">{run.error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Inputs</h3>
              <pre className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-auto">
                {JSON.stringify(run.inputs, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {run.outputs && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">Outputs</h3>
                <pre className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(run.outputs, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="graph">
          <Card>
            <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
              <p className="text-muted-foreground text-lg">
                Graph visualization will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};