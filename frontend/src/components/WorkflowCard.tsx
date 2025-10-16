import { motion } from 'framer-motion';
import { Clock, Cpu, Workflow as WorkflowIcon } from 'lucide-react';
import { Workflow } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

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
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            workflow.isModule ? 'bg-secondary' : 'bg-primary'
          }`}>
            {workflow.isModule ? (
              <Cpu className="h-5 w-5 text-secondary-foreground" />
            ) : (
              <WorkflowIcon className="h-5 w-5 text-primary-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate mb-1">
              {workflow.name}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {workflow.description}
            </p>

            <div className="flex items-center gap-3">
              {workflow.isModule && (
                <Badge variant="secondary" className="text-xs">
                  Module
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDate(workflow.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};