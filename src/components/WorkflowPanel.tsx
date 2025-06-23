
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Workflow } from '../types/workflow';
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
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin hover:animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500 hover:scale-110 hover:rotate-12 transition-all duration-300" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500 hover:scale-110 hover:rotate-12 transition-all duration-300" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400 hover:scale-110 hover:rotate-12 transition-all duration-300" />;
    }
  };

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-500/30 n8n-surface-light hover:border-blue-400 hover:shadow-blue-500/20';
      case 'success':
        return 'border-green-500/30 n8n-surface-light hover:border-green-400 hover:shadow-green-500/20';
      case 'failed':
        return 'border-red-500/30 n8n-surface-light hover:border-red-400 hover:shadow-red-500/20';
      default:
        return 'border-gray-600 n8n-surface hover:border-purple-500/50 hover:shadow-purple-500/20';
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
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold n8n-gradient-text mb-2 hover:glow-text transition-all duration-300">
          Workflow Controls
        </h2>
        <p className="text-gray-300 hover:text-purple-300 transition-colors duration-300">
          Trigger and manage your automation workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow, index) => (
          <Card 
            key={workflow.id} 
            className={`card-hover animate-fade-in ${getStatusColor(workflow.status)} border-2 hover:shadow-2xl transition-all duration-500 group`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg text-white group-hover:n8n-gradient-text transition-all duration-300 hover:scale-105">
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400 group-hover:text-purple-300 transition-colors duration-300">
                    {workflow.description}
                  </CardDescription>
                </div>
                <div className="animate-bounce-in" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                  {getStatusIcon(workflow.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Workflow Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 n8n-surface-light rounded-lg hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat border border-gray-700">
                  <div className="font-semibold text-white group-hover/stat:text-purple-400 transition-colors duration-300">
                    {workflow.executionCount}
                  </div>
                  <div className="text-gray-400 group-hover/stat:text-purple-300 transition-colors duration-300">
                    Runs
                  </div>
                </div>
                <div className="text-center p-2 n8n-surface-light rounded-lg hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat border border-gray-700">
                  <div className="font-semibold text-white group-hover/stat:text-green-400 transition-colors duration-300">
                    {workflow.successRate}%
                  </div>
                  <div className="text-gray-400 group-hover/stat:text-green-300 transition-colors duration-300">
                    Success
                  </div>
                </div>
                <div className="text-center p-2 n8n-surface-light rounded-lg hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat border border-gray-700">
                  <div className="font-semibold text-white group-hover/stat:text-blue-400 transition-colors duration-300">
                    {workflow.avgExecutionTime}ms
                  </div>
                  <div className="text-gray-400 group-hover/stat:text-blue-300 transition-colors duration-300">
                    Avg Time
                  </div>
                </div>
              </div>

              {/* Last Run */}
              {workflow.lastRun && (
                <div className="text-xs text-gray-400 text-center hover:text-purple-300 transition-colors duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>
                  Last run: {workflow.lastRun.toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.4}s` }}>
                {workflow.requiresInput ? (
                  <Dialog open={inputDialogOpen === workflow.id} onOpenChange={(open) => !open && setInputDialogOpen(null)}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1 n8n-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl"
                        disabled={workflow.status === 'running' || !workflow.webhookUrl}
                        onClick={() => handleTriggerWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-2 hover:animate-pulse" />
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
                    className="flex-1 n8n-button text-white border-none shadow-lg hover:shadow-xl"
                    disabled={workflow.status === 'running' || !workflow.webhookUrl}
                    onClick={() => handleTriggerWorkflow(workflow)}
                  >
                    <Play className="h-4 w-4 mr-2 hover:animate-pulse" />
                    {workflow.status === 'running' ? 'Running...' : 'Run Workflow'}
                  </Button>
                )}
              </div>

              {!workflow.webhookUrl && (
                <div className="text-xs text-amber-300 n8n-surface-light p-2 rounded flex items-center hover:bg-amber-900/20 transition-all duration-300 animate-slide-up border border-amber-500/30" style={{ animationDelay: `${index * 0.1 + 0.5}s` }}>
                  <Settings className="h-3 w-3 mr-1 hover:rotate-45 transition-transform duration-300" />
                  <span className="hover:text-amber-200 transition-colors duration-300">
                    Webhook URL not configured
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12 animate-bounce-in">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4 hover:text-purple-400 hover:rotate-45 hover:scale-110 transition-all duration-300" />
          <h3 className="text-lg font-medium text-white mb-2 hover:n8n-gradient-text transition-all duration-300">
            No Workflows Configured
          </h3>
          <p className="text-gray-400 mb-4 hover:text-purple-300 transition-colors duration-300">
            Get started by configuring your first workflow
          </p>
          <Button className="n8n-button text-white border-none">
            Configure Workflows
          </Button>
        </div>
      )}
    </div>
  );
};
