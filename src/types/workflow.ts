
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  webhookUrl?: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun?: Date;
  requiresInput?: boolean;
  inputSchema?: Record<string, any>;
  enabled?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input?: any;
  output?: any;
  result?: any;
  error?: string;
}
