
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
        return 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200';
      case 'success':
        return 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200';
      case 'failed':
        return 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200';
      default:
        return 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100';
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
            <Label htmlFor={key} className="text-black">
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
                className="text-black"
              />
            ) : field.type === 'textarea' ? (
              <Textarea
                id={key}
                value={inputValues[key] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [key]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="text-black"
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 hover:glow-text transition-all duration-300">
          Workflow Controls
        </h2>
        <p className="text-gray-600 hover:text-purple-600 transition-colors duration-300">
          Trigger and manage your automation workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow, index) => (
          <Card 
            key={workflow.id} 
            className={`card-hover animate-fade-in ${getStatusColor(workflow.status)} border-2 hover:shadow-2xl hover:border-purple-300 transition-all duration-500 group`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg text-black font-semibold transition-all duration-300 hover:scale-105">
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-black transition-colors duration-300">
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
                <div className="text-center p-2 bg-white/70 rounded-lg hover:bg-white hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat">
                  <div className="font-semibold text-black transition-colors duration-300">
                    {workflow.executionCount}
                  </div>
                  <div className="text-black transition-colors duration-300">
                    Runs
                  </div>
                </div>
                <div className="text-center p-2 bg-white/70 rounded-lg hover:bg-white hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat">
                  <div className="font-semibold text-black transition-colors duration-300">
                    {workflow.successRate}%
                  </div>
                  <div className="text-black transition-colors duration-300">
                    Success
                  </div>
                </div>
                <div className="text-center p-2 bg-white/70 rounded-lg hover:bg-white hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer group/stat">
                  <div className="font-semibold text-black transition-colors duration-300">
                    {workflow.avgExecutionTime}ms
                  </div>
                  <div className="text-black transition-colors duration-300">
                    Avg Time
                  </div>
                </div>
              </div>

              {/* Last Run */}
              {workflow.lastRun && (
                <div className="text-xs text-black text-center transition-colors duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.3}s` }}>
                  Last run: {workflow.lastRun.toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.4}s` }}>
                {workflow.requiresInput ? (
                  <Dialog open={inputDialogOpen === workflow.id} onOpenChange={(open) => !open && setInputDialogOpen(null)}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1 button-hover bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl"
                        disabled={workflow.status === 'running' || !workflow.webhookUrl}
                        onClick={() => handleTriggerWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-2 hover:animate-pulse" />
                        {workflow.status === 'running' ? 'Running...' : 'Run Workflow'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-black">{workflow.name}</DialogTitle>
                        <DialogDescription className="text-black">
                          This workflow requires input parameters. Please fill out the form below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {renderInputForm(workflow)}
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setInputDialogOpen(null)} className="text-black">
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
                    className="flex-1 button-hover bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg hover:shadow-xl"
                    disabled={workflow.status === 'running' || !workflow.webhookUrl}
                    onClick={() => handleTriggerWorkflow(workflow)}
                  >
                    <Play className="h-4 w-4 mr-2 hover:animate-pulse" />
                    {workflow.status === 'running' ? 'Running...' : 'Run Workflow'}
                  </Button>
                )}
              </div>

              {!workflow.webhookUrl && (
                <div className="text-xs text-black bg-gradient-to-r from-amber-50 to-yellow-50 p-2 rounded flex items-center hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.1 + 0.5}s` }}>
                  <Settings className="h-3 w-3 mr-1 hover:rotate-45 transition-transform duration-300" />
                  <span className="transition-colors duration-300 text-black">
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
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4 hover:text-purple-500 hover:rotate-45 hover:scale-110 transition-all duration-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 hover:rainbow-text transition-all duration-300">
            No Workflows Configured
          </h3>
          <p className="text-gray-500 mb-4 hover:text-purple-600 transition-colors duration-300">
            Get started by configuring your first workflow
          </p>
          <Button className="button-hover bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none">
            Configure Workflows
          </Button>
        </div>
      )}
    </div>
  );
};
