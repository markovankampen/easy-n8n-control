
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Workflow } from '../types/workflow';
import { WebhookService } from '../services/WebhookService';
import { Plus, Trash2, Edit, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '../services/DatabaseService';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflows: Workflow[];
  onUpdateWorkflows: (workflows: Workflow[]) => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  workflows,
  onUpdateWorkflows
}) => {
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'failed'>>({});
  const [activeTab, setActiveTab] = useState<string>('workflows');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: '',
    requiresInput: false,
    inputSchema: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      webhookUrl: '',
      requiresInput: false,
      inputSchema: ''
    });
    setEditingWorkflow(null);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      webhookUrl: workflow.webhookUrl,
      requiresInput: workflow.requiresInput,
      inputSchema: workflow.inputSchema ? JSON.stringify(workflow.inputSchema, null, 2) : ''
    });
    // Switch to the create/edit tab when editing
    setActiveTab('create');
  };

  const handleSaveWorkflow = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and description are required.",
        variant: "destructive"
      });
      return;
    }

    let parsedInputSchema = null;
    if (formData.requiresInput && formData.inputSchema.trim()) {
      try {
        parsedInputSchema = JSON.parse(formData.inputSchema);
      } catch (error) {
        toast({
          title: "Invalid Input Schema",
          description: "Please provide valid JSON for the input schema.",
          variant: "destructive"
        });
        return;
      }
    }

    const workflowData: Workflow = {
      id: editingWorkflow?.id || `wf-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      webhookUrl: formData.webhookUrl.trim(),
      requiresInput: formData.requiresInput,
      inputSchema: parsedInputSchema,
      status: editingWorkflow?.status || 'idle',
      executionCount: editingWorkflow?.executionCount || 0,
      successRate: editingWorkflow?.successRate || 100,
      avgExecutionTime: editingWorkflow?.avgExecutionTime || 0,
      lastRun: editingWorkflow?.lastRun
    };

    try {
      if (editingWorkflow) {
        await DatabaseService.updateWorkflow(workflowData);
      } else {
        await DatabaseService.createWorkflow(workflowData);
      }

      // Reload workflows from database to get fresh data
      const updatedWorkflows = await DatabaseService.getWorkflows();
      onUpdateWorkflows(updatedWorkflows);
      resetForm();
      
      toast({
        title: editingWorkflow ? "Workflow Updated" : "Workflow Created",
        description: `${workflowData.name} has been ${editingWorkflow ? 'updated' : 'created'} successfully.`
      });

      // Switch back to workflows tab after saving
      setActiveTab('workflows');
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingWorkflow ? 'update' : 'create'} workflow.`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await DatabaseService.deleteWorkflow(workflowId);
      
      // Reload workflows from database to get fresh data
      const updatedWorkflows = await DatabaseService.getWorkflows();
      onUpdateWorkflows(updatedWorkflows);
      
      toast({
        title: "Workflow Deleted",
        description: "The workflow and all its executions have been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow.",
        variant: "destructive"
      });
    }
  };

  const handleTestWebhook = async (webhookUrl: string, workflowId: string) => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Test Failed",
        description: "Please enter a webhook URL to test.",
        variant: "destructive"
      });
      return;
    }

    setTestingWebhook(workflowId);
    
    try {
      await WebhookService.testConnection(webhookUrl);
      setTestResults({ ...testResults, [workflowId]: 'success' });
      
      toast({
        title: "Connection Successful",
        description: "The webhook URL is reachable and responding correctly."
      });
    } catch (error) {
      setTestResults({ ...testResults, [workflowId]: 'failed' });
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to reach the webhook URL.",
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const defaultInputSchema = {
    message: {
      type: "text",
      label: "Message",
      placeholder: "Enter your message here",
      required: true
    },
    priority: {
      type: "select",
      label: "Priority",
      options: ["low", "medium", "high"],
      required: false
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Configuration</DialogTitle>
          <DialogDescription>
            Manage your workflows and configure webhook connections
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Manage Workflows</TabsTrigger>
            <TabsTrigger value="create">
              {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </TabsTrigger>
            <TabsTrigger value="help">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            <h3 className="text-lg font-semibold">Your Workflows</h3>
            
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                        <div className="flex items-center space-x-2">
                          {workflow.webhookUrl ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Needs Setup
                            </Badge>
                          )}
                          {workflow.requiresInput && (
                            <Badge variant="secondary">Requires Input</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWorkflow(workflow)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {workflow.webhookUrl && (
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Webhook URL</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              value={workflow.webhookUrl}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestWebhook(workflow.webhookUrl, workflow.id)}
                              disabled={testingWebhook === workflow.id}
                            >
                              {testingWebhook === workflow.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                            {testResults[workflow.id] && (
                              <div className="ml-2">
                                {testResults[workflow.id] === 'success' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {workflows.length === 0 && (
                <div className="text-center py-8">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Workflows Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first workflow to get started</p>
                  <Button onClick={() => { resetForm(); setActiveTab('create'); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}</CardTitle>
                <CardDescription>
                  Configure workflow details and webhook connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Generate Report"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      placeholder="https://your-n8n-instance.com/webhook/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this workflow does"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresInput"
                    checked={formData.requiresInput}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresInput: checked })}
                  />
                  <Label htmlFor="requiresInput">This workflow requires user input</Label>
                </div>

                {formData.requiresInput && (
                  <div className="space-y-2">
                    <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
                    <Textarea
                      id="inputSchema"
                      value={formData.inputSchema}
                      onChange={(e) => setFormData({ ...formData, inputSchema: e.target.value })}
                      placeholder={JSON.stringify(defaultInputSchema, null, 2)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Define the input fields your workflow needs. Supported types: text, textarea, select
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => { resetForm(); setActiveTab('workflows'); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveWorkflow}>
                    {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>N8N Setup Guide</CardTitle>
                <CardDescription>
                  Step-by-step instructions for connecting your N8N workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">1. Create Webhook in N8N</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>• Open your N8N workflow editor</p>
                      <p>• Add a "Webhook" node as the trigger</p>
                      <p>• Set the HTTP method to "POST"</p>
                      <p>• Copy the webhook URL from the node</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">2. Configure Response</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>• Add a "Respond to Webhook" node at the end</p>
                      <p>• Set response format to JSON</p>
                      <p>• Include status and result data</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">3. Test Connection</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>• Activate your N8N workflow</p>
                      <p>• Paste the webhook URL in the configuration above</p>
                      <p>• Use the test button to verify connectivity</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">4. Input Parameters (Optional)</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>• Access input data via expressions: <code className="bg-white px-1 rounded">{'{{$json.parameterName}}'}</code></p>
                      <p>• Example: <code className="bg-white px-1 rounded">{'{{$json.message}}'}</code> for message input</p>
                      <p>• Configure input schema in JSON format above</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Use HTTPS for webhook URLs in production</li>
                    <li>• Add error handling with "IF" nodes</li>
                    <li>• Test with different input parameters</li>
                    <li>• Monitor execution logs in N8N</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
