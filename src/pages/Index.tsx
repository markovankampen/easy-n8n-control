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

// Mock Data
const initialWorkflows: Workflow[] = [
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
  <Card className="n8n-card">
    <CardHeader>
      <CardTitle className="n8n-gradient-text">Data Visualization</CardTitle>
      <CardDescription className="text-gray-400">
        Insights into workflow performance
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center">
        <p className="text-gray-300">
          Mock data visualization component
        </p>
      </div>
    </CardContent>
  </Card>
);

const MockWorkflowInsights = ({ workflows }: { workflows: Workflow[] }) => (
  <Card className="n8n-card">
    <CardHeader>
      <CardTitle className="n8n-gradient-text">Workflow Insights</CardTitle>
      <CardDescription className="text-gray-400">
        Key metrics and insights for your workflows
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-300">Total Workflows:</span>
          <span className="text-white">{workflows.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Successful Runs:</span>
          <span className="text-green-400">
            {workflows.filter((w) => w.status === 'success').length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Average Execution Time:</span>
          <span className="text-blue-400">
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
  <Card className="n8n-card">
    <CardHeader>
      <CardTitle className="n8n-gradient-text">System Status</CardTitle>
      <CardDescription className="text-gray-400">
        Real-time status of your workflow engine
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Connection Status:</span>
        {isConnected ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-400" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Last Update:</span>
        <span className="text-white">
          {lastUpdate ? lastUpdate.toLocaleString() : 'N/A'}
        </span>
      </div>
      {error && (
        <div className="text-red-400">
          Error: {error}
        </div>
      )}
    </CardContent>
  </Card>
);

const MockActivityLog = () => (
  <Card className="n8n-card">
    <CardHeader>
      <CardTitle className="n8n-gradient-text">Activity Log</CardTitle>
      <CardDescription className="text-gray-400">
        Recent workflow activity
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {mockActivityLog.map((log) => (
          <li key={log.id} className="flex items-center justify-between text-sm text-gray-300">
            <span>{log.workflow}</span>
            <div className="flex items-center">
              <span className={`mr-2 ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                {log.status}
              </span>
              <span>{log.time.toLocaleTimeString()}</span>
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
  workflows: Workflow[];
  onWorkflowsChange: (newWorkflows: Workflow[]) => void;
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
      <DialogContent className="n8n-surface">
        <DialogHeader>
          <DialogTitle className="n8n-gradient-text">Workflow Configuration</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your workflow settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {localWorkflows.map((workflow) => (
            <Card key={workflow.id} className="n8n-card">
              <CardHeader>
                <CardTitle className="text-white">{workflow.name}</CardTitle>
                <CardDescription className="text-gray-400">{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`webhook-${workflow.id}`} className="text-gray-300">Webhook URL</Label>
                  <Input
                    id={`webhook-${workflow.id}`}
                    value={workflow.webhookUrl || ''}
                    onChange={(e) => handleInputChange(workflow.id, 'webhookUrl', e.target.value)}
                    className="n8n-surface-light text-white"
                  />
                </div>
                {/*<div className="flex items-center justify-between">
                  <Label htmlFor={`enabled-${workflow.id}`} className="text-gray-300">Enabled</Label>
                  <Switch
                    id={`enabled-${workflow.id}`}
                    checked={workflow.enabled}
                    onCheckedChange={() => handleToggle(workflow.id)}
                  />
                </div>*/}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="n8n-button">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Index() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
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

  const handleWorkflowsChange = (newWorkflows: Workflow[]) => {
    setWorkflows(newWorkflows);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold n8n-gradient-text mb-4 hover:glow-text transition-all duration-300">
            Workflow Dashboard
          </h1>
          <p className="text-xl text-gray-300 hover:text-purple-300 transition-colors duration-300">
            Automate your processes with powerful workflows
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workflows" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 n8n-surface border border-gray-700">
            <TabsTrigger 
              value="workflows" 
              className="data-[state=active]:n8n-gradient data-[state=active]:text-white hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              <Play className="h-4 w-4 mr-2 icon-bounce" />
              Workflows
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="data-[state=active]:n8n-gradient data-[state=active]:text-white hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              <Activity className="h-4 w-4 mr-2 icon-wiggle" />
              Status
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:n8n-gradient data-[state=active]:text-white hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              <BarChart3 className="h-4 w-4 mr-2 icon-bounce" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="config" 
              className="data-[state=active]:n8n-gradient data-[state=active]:text-white hover:bg-gray-700 transition-all duration-300 hover:scale-105"
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
                  <Card className="n8n-card hover:scale-105 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Workflow className="h-8 w-8 text-purple-400 icon-bounce" />
                      </div>
                      <div className="text-2xl font-bold text-white">{workflows.length}</div>
                      <div className="text-sm text-gray-400">Total Workflows</div>
                    </CardContent>
                  </Card>

                  <Card className="n8n-card hover:scale-105 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-8 w-8 text-green-400 icon-wiggle" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'success').length}
                      </div>
                      <div className="text-sm text-gray-400">Successful</div>
                    </CardContent>
                  </Card>

                  <Card className="n8n-card hover:scale-105 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Loader2 className="h-8 w-8 text-blue-400 icon-bounce" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'running').length}
                      </div>
                      <div className="text-sm text-gray-400">Running</div>
                    </CardContent>
                  </Card>

                  <Card className="n8n-card hover:scale-105 transition-all duration-300 item-hover">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertCircle className="h-8 w-8 text-red-400 icon-wiggle" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {workflows.filter(w => w.status === 'failed').length}
                      </div>
                      <div className="text-sm text-gray-400">Failed</div>
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
              <MockDataVisualization workflows={workflows} />
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="animate-slide-up">
            <Card className="n8n-card">
              <CardHeader>
                <CardTitle className="n8n-gradient-text">Workflow Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your workflow settings and webhook configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setConfigModalOpen(true)}
                    className="n8n-button hover:scale-105 transition-all duration-300"
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
