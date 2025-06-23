
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Workflow } from '../pages/Index';
import { Play, Settings, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';

interface WorkflowPanelProps {
  workflows: Workflow[];
  onTriggerWorkflow: (workflowId: string, params?: any) => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  workflows,
  onTriggerWorkflow
}) => {
  const [inputDialogOpen, setInputDialogOpen] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const handleTriggerWorkflow = (workflow: Workflow) => {
    if (workflow.requiresInput && workflow.inputSchema) {
      setInputDialogOpen(workflow.id);
      setInputValues({});
    } else {
      onTriggerWorkflow(workflow.id);
    }
  };

  const handleSubmitWithInput = (workflowId: string) => {
    onTriggerWorkflow(workflowId, inputValues);
    setInputDialogOpen(null);
    setInputValues({});
  };

  const renderInputForm = (workflow: Workflow) => {
    if (!workflow.inputSchema) return null;

    return (
      <div className="space-y-4">
        {Object.entries(workflow.inputSchema).map(([key, field]: [string, any]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'text' ? (
              <Input
                id={key}
                value={inputValues[key] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : field.type === 'textarea' ? (
              <Textarea
                id={key}
                value={inputValues[key] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Controls</h2>
        <p className="text-gray-600">Trigger and manage your automation workflows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className={`transition-all duration-200 hover:shadow-md ${getStatusColor(workflow.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription className="text-sm">{workflow.description}</CardDescription>
                </div>
                {getStatusIcon(workflow.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Workflow Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="font-semibold text-gray-900">{workflow.executionCount}</div>
                  <div className="text-gray-500">Runs</div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="font-semibold text-gray-900">{workflow.successRate}%</div>
                  <div className="text-gray-500">Success</div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="font-semibold text-gray-900">{workflow.avgExecutionTime}ms</div>
                  <div className="text-gray-500">Avg Time</div>
                </div>
              </div>

              {/* Last Run */}
              {workflow.lastRun && (
                <div className="text-xs text-gray-500 text-center">
                  Last run: {workflow.lastRun.toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {workflow.requiresInput ? (
                  <Dialog open={inputDialogOpen === workflow.id} onOpenChange={(open) => !open && setInputDialogOpen(null)}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1"
                        disabled={workflow.status === 'running' || !workflow.webhookUrl}
                        onClick={() => handleTriggerWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {workflow.status === 'running' ? 'Running...' : 'Run Workflow'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{workflow.name}</DialogTitle>
                        <DialogDescription>
                          This workflow requires input parameters. Please fill out the form below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {renderInputForm(workflow)}
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setInputDialogOpen(null)}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleSubmitWithInput(workflow.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Workflow
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    className="flex-1"
                    disabled={workflow.status === 'running' || !workflow.webhookUrl}
                    onClick={() => handleTriggerWorkflow(workflow)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {workflow.status === 'running' ? 'Running...' : 'Run Workflow'}
                  </Button>
                )}
              </div>

              {!workflow.webhookUrl && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-center">
                  <Settings className="h-3 w-3 mr-1" />
                  Webhook URL not configured
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Configured</h3>
          <p className="text-gray-500 mb-4">Get started by configuring your first workflow</p>
          <Button>Configure Workflows</Button>
        </div>
      )}
    </div>
  );
};
