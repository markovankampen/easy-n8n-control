
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Activity,
  BarChart3,
  Workflow
} from 'lucide-react';
import { WorkflowPanel } from '@/components/WorkflowPanel';
import { Workflow as WorkflowType } from '@/types/workflow';

// Mock Data
const initialWorkflows: WorkflowType[] = [
  {
    id: '1',
    name: 'Send Welcome Email',
    description: 'Sends a welcome email to new users',
    status: 'success',
    webhookUrl: 'https://example.com/webhook1',
    executionCount: 50,
    successRate: 95,
    avgExecutionTime: 250,
    lastRun: new Date(),
    requiresInput: false,
    inputSchema: null,
  },
  {
    id: '2',
    name: 'Create Invoice',
    description: 'Creates an invoice for a new order',
    status: 'running',
    webhookUrl: 'https://example.com/webhook2',
    executionCount: 30,
    successRate: 80,
    avgExecutionTime: 500,
    lastRun: new Date(),
    requiresInput: true,
    inputSchema: {
      amount: { type: 'text', label: 'Amount', required: true, placeholder: 'Enter amount' },
      description: { type: 'textarea', label: 'Description', required: false, placeholder: 'Enter description' },
    },
  },
  {
    id: '3',
    name: 'Sync Data to CRM',
    description: 'Syncs new user data to CRM',
    status: 'failed',
    webhookUrl: 'https://example.com/webhook3',
    executionCount: 75,
    successRate: 60,
    avgExecutionTime: 750,
    lastRun: new Date(),
    requiresInput: false,
    inputSchema: null,
  },
  {
    id: '4',
    name: 'Backup Database',
    description: 'Backs up the database to a remote server',
    status: 'idle',
    webhookUrl: 'https://example.com/webhook4',
    executionCount: 120,
    successRate: 99,
    avgExecutionTime: 1200,
    lastRun: new Date(),
    requiresInput: false,
    inputSchema: null,
  },
];

const mockActivityLog = [
  { id: 1, workflow: 'Send Welcome Email', status: 'success', time: new Date() },
  { id: 2, workflow: 'Create Invoice', status: 'running', time: new Date() },
  { id: 3, workflow: 'Sync Data to CRM', status: 'failed', time: new Date() },
];

const MockDataVisualization = () => (
  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-cyan-400">Data Visualization</CardTitle>
      <CardDescription className="text-slate-300">
        Insights into workflow performance
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center">
        <p className="text-slate-200">
          Mock data visualization component
        </p>
      </div>
    </CardContent>
  </Card>
);

const MockWorkflowInsights = ({ workflows }: { workflows: WorkflowType[] }) => (
  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-cyan-400">Workflow Insights</CardTitle>
      <CardDescription className="text-slate-300">
        Key metrics and insights for your workflows
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-slate-200">Total Workflows:</span>
          <span className="text-white font-semibold">{workflows.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-200">Successful Runs:</span>
          <span className="text-emerald-400 font-semibold">
            {workflows.filter((w) => w.status === 'success').length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-200">Average Execution Time:</span>
          <span className="text-blue-400 font-semibold">
            {workflows.reduce((acc, w) => acc + w.avgExecutionTime, 0) /
              workflows.length}
            ms
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MockStatusDisplay = ({
  isConnected,
  lastUpdate,
  error,
}: {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}) => (
  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-cyan-400">System Status</CardTitle>
      <CardDescription className="text-slate-300">
        Real-time status of your workflow engine
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-slate-200">Connection Status:</span>
        {isConnected ? (
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-200">Last Update:</span>
        <span className="text-white font-semibold">
          {lastUpdate ? lastUpdate.toLocaleString() : 'N/A'}
        </span>
      </div>
      {error && (
        <div className="text-red-400 font-semibold">
          Error: {error}
        </div>
      )}
    </CardContent>
  </Card>
);

const MockActivityLog = () => (
  <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-cyan-400">Activity Log</CardTitle>
      <CardDescription className="text-slate-300">
        Recent workflow activity
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {mockActivityLog.map((log) => (
          <li key={log.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-200">{log.workflow}</span>
            <div className="flex items-center">
              <span className={`mr-2 font-semibold ${log.status === 'success' ? 'text-emerald-400' : log.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                {log.status}
              </span>
              <span className="text-slate-300">{log.time.toLocaleTimeString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const MockConfigurationModal = ({
  isOpen,
  onClose,
  workflows,
  onWorkflowsChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  workflows: WorkflowType[];
  onWorkflowsChange: (newWorkflows: WorkflowType[]) => void;
}) => {
  const [localWorkflows, setLocalWorkflows] = useState([...workflows]);

  useEffect(() => {
    setLocalWorkflows([...workflows]);
  }, [workflows]);

  const handleInputChange = (id: string, key: string, value: any) => {
    const updatedWorkflows = localWorkflows.map((workflow) =>
      workflow.id === id ? { ...workflow, [key]: value } : workflow
    );
    setLocalWorkflows(updatedWorkflows);
  };

  const handleToggle = (id: string) => {
    const updatedWorkflows = localWorkflows.map(workflow =>
      workflow.id === id ? { ...workflow, enabled: !workflow.enabled } : workflow
    );
    setLocalWorkflows(updatedWorkflows);
  };

  const handleSave = () => {
    onWorkflowsChange(localWorkflows);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">Workflow Configuration</DialogTitle>
          <DialogDescription className="text-slate-300">
            Manage your workflow settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {localWorkflows.map((workflow) => (
            <Card key={workflow.id} className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">{workflow.name}</CardTitle>
                <CardDescription className="text-slate-300">{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`webhook-${workflow.id}`} className="text-slate-200">Webhook URL</Label>
                  <Input
                    id={`webhook-${workflow.id}`}
                    value={workflow.webhookUrl || ''}
                    onChange={(e) => handleInputChange(workflow.id, 'webhookUrl', e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-200 hover:bg-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Index() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>(initialWorkflows);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Mock status updates
    const intervalId = setInterval(() => {
      setIsConnected((prev) => !prev);
      setLastUpdate(new Date());
      setError(isConnected ? null : 'Connection lost');
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isConnected]);

  const handleTriggerWorkflow = (workflowId: string, params?: any) => {
    setWorkflows((prevWorkflows) =>
      prevWorkflows.map((workflow) =>
        workflow.id === workflowId ? { ...workflow, status: 'running' } : workflow
      )
    );

    // Mock workflow execution
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setWorkflows((prevWorkflows) =>
        prevWorkflows.map((workflow) =>
          workflow.id === workflowId
            ? {
                ...workflow,
                status: success ? 'success' : 'failed',
                lastRun: new Date(),
                executionCount: workflow.executionCount + 1,
                successRate: success
                  ? Math.min(100, workflow.successRate + 5)
                  : Math.max(0, workflow.successRate - 5),
                avgExecutionTime: Math.floor(Math.random() * 1000),
              }
            : workflow
        )
      );
    }, 3000);
  };

  const handleWorkflowsChange = (newWorkflows: WorkflowType[]) => {
    setWorkflows(newWorkflows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4 hover:from-cyan-300 hover:to-blue-300 transition-all duration-300">
            Workflow Dashboard
          </h1>
          <p className="text-xl text-slate-200 hover:text-cyan-300 transition-colors duration-300">
            Automate your processes with powerful workflows
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workflows" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="workflows" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-slate-200"
            >
              <Play className="h-4 w-4 mr-2 icon-bounce" />
              Workflows
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-slate-200"
            >
              <Activity className="h-4 w-4 mr-2 icon-wiggle" />
              Status
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-slate-200"
            >
              <BarChart3 className="h-4 w-4 mr-2 icon-bounce" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="config" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-slate-200"
            >
              <Settings className="h-4 w-4 mr-2 icon-wiggle" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Stats */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-slate-800 border-slate-700 hover:scale-105 hover:bg-slate-750 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Workflow className="h-8 w-8 text-cyan-400 icon-bounce" />
                      </div>
                      <div className="text-2xl font-bold text-white">{workflows.length}</div>
                      <div className="text-sm text-slate-300">Total Workflows</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700 hover:scale-105 hover:bg-slate-750 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-8 w-8 text-emerald-400 icon-wiggle" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'success').length}
                      </div>
                      <div className="text-sm text-slate-300">Successful</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700 hover:scale-105 hover:bg-slate-750 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Loader2 className="h-8 w-8 text-blue-400 icon-bounce" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'running').length}
                      </div>
                      <div className="text-sm text-slate-300">Running</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700 hover:scale-105 hover:bg-slate-750 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertCircle className="h-8 w-8 text-red-400 icon-wiggle" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'failed').length}
                      </div>
                      <div className="text-sm text-slate-300">Failed</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Workflow Panel */}
              <div className="lg:col-span-3">
                <WorkflowPanel 
                  workflows={workflows}
                  onTriggerWorkflow={handleTriggerWorkflow}
                />
              </div>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="animate-slide-up">
            <MockStatusDisplay 
              isConnected={isConnected}
              lastUpdate={lastUpdate}
              error={error}
            />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MockWorkflowInsights workflows={workflows} />
              <MockDataVisualization />
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="animate-slide-up">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Workflow Configuration</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage your workflow settings and webhook configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setConfigModalOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:scale-105 transition-all duration-300 text-white"
                  >
                    <Settings className="h-4 w-4 mr-2 icon-wiggle" />
                    Open Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activity Log */}
        <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <MockActivityLog />
        </div>

        {/* Configuration Modal */}
        <MockConfigurationModal 
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          workflows={workflows}
          onWorkflowsChange={handleWorkflowsChange}
        />
      </div>
    </div>
  );
}
