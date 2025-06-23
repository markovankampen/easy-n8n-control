
import React, { useState, useEffect } from 'react';
import { WorkflowPanel } from '../components/WorkflowPanel';
import { StatusDisplay } from '../components/StatusDisplay';
import { DataVisualization } from '../components/DataVisualization';
import { ActivityLog } from '../components/ActivityLog';
import { ConfigurationModal } from '../components/ConfigurationModal';
import { WebhookService } from '../services/WebhookService';
import { StorageService } from '../services/StorageService';
import { Settings, Activity, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  webhookUrl: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: Date;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  requiresInput: boolean;
  inputSchema?: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
}

const Index = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'control' | 'data' | 'activity'>('control');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const savedWorkflows = StorageService.getWorkflows();
    const savedExecutions = StorageService.getExecutions();
    
    setWorkflows(savedWorkflows);
    setExecutions(savedExecutions);

    // Initialize default workflows if none exist
    if (savedWorkflows.length === 0) {
      const defaultWorkflows: Workflow[] = [
        {
          id: 'wf-1',
          name: 'Generate Report',
          description: 'Generate daily business report',
          webhookUrl: '',
          status: 'idle',
          executionCount: 0,
          successRate: 100,
          avgExecutionTime: 0,
          requiresInput: false
        },
        {
          id: 'wf-2',
          name: 'Send Notifications',
          description: 'Send email notifications to team',
          webhookUrl: '',
          status: 'idle',
          executionCount: 0,
          successRate: 100,
          avgExecutionTime: 0,
          requiresInput: true,
          inputSchema: {
            message: { type: 'text', label: 'Message', required: true },
            recipients: { type: 'text', label: 'Recipients (comma-separated)', required: true }
          }
        },
        {
          id: 'wf-3',
          name: 'Data Sync',
          description: 'Synchronize data between systems',
          webhookUrl: '',
          status: 'idle',
          executionCount: 0,
          successRate: 100,
          avgExecutionTime: 0,
          requiresInput: false
        }
      ];
      setWorkflows(defaultWorkflows);
      StorageService.saveWorkflows(defaultWorkflows);
    }
  };

  const handleWorkflowTrigger = async (workflowId: string, params?: any) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    if (!workflow.webhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please configure the webhook URL for this workflow.",
        variant: "destructive"
      });
      return;
    }

    // Create execution record
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      workflowName: workflow.name,
      status: 'running',
      startTime: new Date()
    };

    // Update workflow status
    const updatedWorkflows = workflows.map(w => 
      w.id === workflowId ? { ...w, status: 'running' as const } : w
    );
    setWorkflows(updatedWorkflows);
    
    // Add execution to list
    const updatedExecutions = [execution, ...executions];
    setExecutions(updatedExecutions);
    
    // Save to storage
    StorageService.saveWorkflows(updatedWorkflows);
    StorageService.saveExecutions(updatedExecutions);

    toast({
      title: "Workflow Started",
      description: `${workflow.name} is now running...`
    });

    try {
      const result = await WebhookService.triggerWorkflow(workflow.webhookUrl, params);
      
      // Update execution with success
      const completedExecution = {
        ...execution,
        status: 'success' as const,
        endTime: new Date(),
        duration: Date.now() - execution.startTime.getTime(),
        result
      };
      
      handleWorkflowComplete(workflowId, completedExecution);
      
    } catch (error) {
      // Update execution with failure
      const failedExecution = {
        ...execution,
        status: 'failed' as const,
        endTime: new Date(),
        duration: Date.now() - execution.startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      handleWorkflowComplete(workflowId, failedExecution);
    }
  };

  const handleWorkflowComplete = (workflowId: string, execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    // Update workflow statistics
    const newExecutionCount = workflow.executionCount + 1;
    const isSuccess = execution.status === 'success';
    const newSuccessCount = Math.round(workflow.successRate * workflow.executionCount / 100) + (isSuccess ? 1 : 0);
    const newSuccessRate = Math.round((newSuccessCount / newExecutionCount) * 100);
    const newAvgTime = workflow.avgExecutionTime === 0 ? 
      (execution.duration || 0) :
      Math.round((workflow.avgExecutionTime * workflow.executionCount + (execution.duration || 0)) / newExecutionCount);

    const updatedWorkflows = workflows.map(w => 
      w.id === workflowId ? {
        ...w,
        status: (execution.status === 'success' ? 'success' : 'failed') as Workflow['status'],
        lastRun: execution.endTime,
        executionCount: newExecutionCount,
        successRate: newSuccessRate,
        avgExecutionTime: newAvgTime
      } : w
    );

    const updatedExecutions = executions.map(e => 
      e.id === execution.id ? execution : e
    );

    setWorkflows(updatedWorkflows);
    setExecutions(updatedExecutions);
    
    StorageService.saveWorkflows(updatedWorkflows);
    StorageService.saveExecutions(updatedExecutions);

    toast({
      title: execution.status === 'success' ? "Workflow Completed" : "Workflow Failed",
      description: execution.status === 'success' ? 
        `${workflow.name} completed successfully` : 
        `${workflow.name} failed: ${execution.error}`,
      variant: execution.status === 'success' ? "default" : "destructive"
    });

    // Reset status to idle after 3 seconds
    setTimeout(() => {
      const resetWorkflows = workflows.map(w => 
        w.id === workflowId ? { ...w, status: 'idle' as const } : w
      );
      setWorkflows(resetWorkflows);
      StorageService.saveWorkflows(resetWorkflows);
    }, 3000);
  };

  const handleWorkflowUpdate = (updatedWorkflows: Workflow[]) => {
    setWorkflows(updatedWorkflows);
    StorageService.saveWorkflows(updatedWorkflows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">N8N Workflow Dashboard</h1>
                <p className="text-sm text-gray-500">Control and monitor your automation workflows</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <StatusDisplay workflows={workflows} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigOpen(true)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setSelectedTab('control')}
              className={`${
                selectedTab === 'control'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Zap className="h-4 w-4" />
              <span>Workflow Control</span>
            </button>
            <button
              onClick={() => setSelectedTab('data')}
              className={`${
                selectedTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Data & Analytics</span>
            </button>
            <button
              onClick={() => setSelectedTab('activity')}
              className={`${
                selectedTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Activity className="h-4 w-4" />
              <span>Activity Log</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'control' && (
          <WorkflowPanel
            workflows={workflows}
            onTriggerWorkflow={handleWorkflowTrigger}
          />
        )}
        
        {selectedTab === 'data' && (
          <DataVisualization
            workflows={workflows}
            executions={executions}
          />
        )}
        
        {selectedTab === 'activity' && (
          <ActivityLog executions={executions} />
        )}
      </main>

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        workflows={workflows}
        onUpdateWorkflows={handleWorkflowUpdate}
      />
    </div>
  );
};

export default Index;
