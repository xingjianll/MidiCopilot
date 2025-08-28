export interface Workflow {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  createdAt: string;
  isModule: boolean;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
}

export interface WorkflowInput {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface WorkflowOutput {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface Run {
  id: string;
  workflowId: string;
  workflowName: string;
  detailedDescription: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
}

export interface Sample {
  id: string;
  name: string;
  type: 'midi' | 'audio';
  duration: number;
  createdAt: string;
  size: number;
  format: string;
  detailedDescription: string;
}

export type ViewMode = 'card' | 'column';