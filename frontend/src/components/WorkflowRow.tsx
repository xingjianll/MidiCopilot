import { motion } from 'framer-motion';
import { Clock, Cpu, Workflow as WorkflowIcon } from 'lucide-react';
import { Workflow } from '../types';
import { Badge } from './ui/badge';

interface WorkflowRowProps {
  workflow: Workflow;
  onClick: () => void;
  isSelected?: boolean;
}

export const WorkflowRow: React.FC<WorkflowRowProps> = ({ 
  workflow, 
  onClick, 
  isSelected = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      className={`flex items-center p-4 cursor-pointer border-b transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-4 flex-shrink-0 ${
        workflow.isModule ? 'bg-secondary' : 'bg-primary'
      }`}>
        {workflow.isModule ? (
          <Cpu className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <WorkflowIcon className="h-4 w-4 text-primary-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {workflow.name}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {workflow.description}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {workflow.isModule && (
          <Badge variant="secondary" className="text-xs">
            Module
          </Badge>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[80px] text-right">
          <Clock className="h-3 w-3" />
          <span>{formatDate(workflow.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};