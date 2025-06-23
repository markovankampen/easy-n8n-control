import React, { useState, useEffect } from 'react';
import { WorkflowPanel } from '../components/WorkflowPanel';
import { StatusDisplay } from '../components/StatusDisplay';
import { DataVisualization } from '../components/DataVisualization';
import { ActivityLog } from '../components/ActivityLog';
import { WorkflowInsights } from '../components/WorkflowInsights';
import { ConfigurationModal } from '../components/ConfigurationModal';
import { WebhookService } from '../services/WebhookService';
import { DatabaseService } from '../services/DatabaseService';
import { Settings, Activity, BarChart3, Zap, TrendingUp } from 'lucide-react';
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
  const [selectedTab, setSelectedTab] = useState<'control' | 'data' | 'activity' | 'insights'>('control');
  const [loading, setLoading] = useState(true);
  const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set());
  const [workflowOrder, setWorkflowOrder] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      const [workflowsData, executionsData] = await Promise.all([
        DatabaseService.getWorkflows(),
        DatabaseService.getExecutions()
      ]);
      
      console.log('Loaded workflows:', workflowsData.length);
      console.log('Loaded executions:', executionsData.length);
      
      // Update workflow order, removing deleted workflows and adding new ones
      const currentWorkflowIds = workflowsData.map(w => w.id);
      const filteredOrder = workflowOrder.filter(id => currentWorkflowIds.includes(id));
      const newWorkflowIds = currentWorkflowIds.filter(id => !workflowOrder.includes(id));
      setWorkflowOrder([...filteredOrder, ...newWorkflowIds]);
      
      setWorkflows(workflowsData);
      setExecutions(executionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load workflow data from database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowTrigger = async (workflowId: string, params?: any) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) {
      console.error('Workflow not found:', workflowId);
      return;
    }

    if (!workflow.webhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please configure the webhook URL for this workflow.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting workflow execution:', { workflowId, workflowName: workflow.name });

    // Set workflow as running in local state only
    setRunningWorkflows(prev => new Set(prev).add(workflowId));

    // Create execution record with unique ID
    const executionId = `exec-${workflowId}-${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflowId,
      workflowName: workflow.name,
      status: 'running',
      startTime: new Date()
    };

    try {
      // Add execution to local list
      setExecutions(prev => [execution, ...prev]);
      
      // Save execution to database
      await DatabaseService.createExecution(execution);

      toast({
        title: "Workflow Started",
        description: `${workflow.name} is now running...`
      });

      console.log('Executing workflow:', { workflowId, executionId, webhookUrl: workflow.webhookUrl });

      // Execute workflow
      const result = await WebhookService.triggerWorkflow(workflow.webhookUrl, params);
      
      // Update execution with success
      const completedExecution = {
        ...execution,
        status: 'success' as const,
        endTime: new Date(),
        duration: Date.now() - execution.startTime.getTime(),
        result
      };
      
      console.log('Workflow completed successfully:', { workflowId, executionId });
      await handleWorkflowComplete(workflowId, completedExecution);
      
    } catch (error) {
      console.error('Workflow failed:', { workflowId, executionId, error });
      // Update execution with failure
      const failedExecution = {
        ...execution,
        status: 'failed' as const,
        endTime: new Date(),
        duration: Date.now() - execution.startTime.getTime(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await handleWorkflowComplete(workflowId, failedExecution);
    }
  };

  const handleWorkflowComplete = async (workflowId: string, execution: WorkflowExecution) => {
    try {
      console.log('Updating execution in database:', { executionId: execution.id, workflowId, status: execution.status });
      
      // Update execution in database
      await DatabaseService.updateExecution(execution);
      
      // Update local executions list
      setExecutions(prev => 
        prev.map(exec => exec.id === execution.id ? execution : exec)
      );
      
      // Only reload workflows if the workflow still exists in the current state
      if (workflows.find(w => w.id === workflowId)) {
        console.log('Reloading workflow statistics after execution');
        const [workflowsData] = await Promise.all([
          DatabaseService.getWorkflows()
        ]);
        
        setWorkflows(workflowsData);
      }

      toast({
        title: execution.status === 'success' ? "Workflow Completed" : "Workflow Failed",
        description: execution.status === 'success' ? 
          `${execution.workflowName} completed successfully` : 
          `${execution.workflowName} failed: ${execution.error}`,
        variant: execution.status === 'success' ? "default" : "destructive"
      });

      // Remove from running set after a brief delay
      setTimeout(() => {
        setRunningWorkflows(prev => {
          const newSet = new Set(prev);
          newSet.delete(workflowId);
          return newSet;
        });
      }, 1000);
    } catch (error) {
      console.error('Error completing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow execution status.",
        variant: "destructive"
      });
      
      // Remove from running set even on error
      setRunningWorkflows(prev => {
        const newSet = new Set(prev);
        newSet.delete(workflowId);
        return newSet;
      });
    }
  };

  const handleWorkflowUpdate = async (updatedWorkflows: Workflow[]) => {
    try {
      console.log('Handling workflow update with', updatedWorkflows.length, 'workflows');
      
      // Update local state immediately
      setWorkflows(updatedWorkflows);
      
      // Update workflow order to reflect current workflows
      const currentWorkflowIds = updatedWorkflows.map(w => w.id);
      const filteredOrder = workflowOrder.filter(id => currentWorkflowIds.includes(id));
      const newWorkflowIds = currentWorkflowIds.filter(id => !workflowOrder.includes(id));
      setWorkflowOrder([...filteredOrder, ...newWorkflowIds]);
      
      // Also reload executions to ensure consistency
      const executionsData = await DatabaseService.getExecutions();
      setExecutions(executionsData);
      
      toast({
        title: "Configuration Updated",
        description: "Workflow configurations have been saved.",
      });
    } catch (error) {
      console.error('Error updating workflows:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow configurations.",
        variant: "destructive"
      });
    }
  };

  // Create enhanced workflows with running status and maintain stable order
  const getSortedWorkflows = () => {
    if (workflowOrder.length === 0) return workflows;
    
    // Sort workflows according to the established order
    const sortedWorkflows = [...workflows].sort((a, b) => {
      const indexA = workflowOrder.indexOf(a.id);
      const indexB = workflowOrder.indexOf(b.id);
      
      // If both workflows are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither is in the order array, maintain original order
      return 0;
    });
    
    return sortedWorkflows;
  };

  const enhancedWorkflows = getSortedWorkflows().map(workflow => ({
    ...workflow,
    status: runningWorkflows.has(workflow.id) ? 'running' as const : 'idle' as const
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              <StatusDisplay workflows={enhancedWorkflows} />
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
            <button
              onClick={() => setSelectedTab('insights')}
              className={`${
                selectedTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Insights</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'control' && (
          <WorkflowPanel
            workflows={enhancedWorkflows}
            onTriggerWorkflow={handleWorkflowTrigger}
          />
        )}
        
        {selectedTab === 'data' && (
          <DataVisualization
            workflows={enhancedWorkflows}
            executions={executions}
          />
        )}
        
        {selectedTab === 'activity' && (
          <ActivityLog executions={executions} />
        )}
        
        {selectedTab === 'insights' && (
          <WorkflowInsights executions={executions} />
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
