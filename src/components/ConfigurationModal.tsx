
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow } from '../pages/Index';
import { DatabaseService } from '../services/DatabaseService';
import { MCPService } from '../services/MCPService';
import { Plus, Trash2, Save, Server, TestTube, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [editedWorkflows, setEditedWorkflows] = useState<Workflow[]>([]);
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'failed' | null>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEditedWorkflows(workflows.map(w => ({ ...w })));
      setConnectionStatus({});
    }
  }, [isOpen, workflows]);

  const addWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: 'New Workflow',
      description: 'Workflow description',
      webhookUrl: '',
      status: 'idle',
      executionCount: 0,
      successRate: 100,
      avgExecutionTime: 0,
      requiresInput: false,
      inputSchema: null
    };
    setEditedWorkflows([...editedWorkflows, newWorkflow]);
  };

  const removeWorkflow = async (workflowId: string) => {
    try {
      await DatabaseService.deleteWorkflow(workflowId);
      const updatedWorkflows = editedWorkflows.filter(w => w.id !== workflowId);
      setEditedWorkflows(updatedWorkflows);
      
      toast({
        title: "Workflow Deleted",
        description: "The workflow has been successfully removed.",
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

  const updateWorkflow = (id: string, field: keyof Workflow, value: any) => {
    setEditedWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
    
    // Clear connection status when URL changes
    if (field === 'webhookUrl') {
      setConnectionStatus(prev => ({ ...prev, [id]: null }));
    }
  };

  const testMCPConnection = async (workflow: Workflow) => {
    if (!workflow.webhookUrl) {
      toast({
        title: "No MCP Server URL",
        description: "Please enter a MCP server URL first.",
        variant: "destructive"
      });
      return;
    }

    if (!MCPService.validateMCPServerUrl(workflow.webhookUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid MCP server URL (http:// or https://).",
        variant: "destructive"
      });
      return;
    }

    setTestingConnections(prev => new Set(prev).add(workflow.id));
    setConnectionStatus(prev => ({ ...prev, [workflow.id]: null }));

    try {
      const isConnected = await MCPService.testConnection(workflow.webhookUrl);
      
      if (isConnected) {
        setConnectionStatus(prev => ({ ...prev, [workflow.id]: 'success' }));
        toast({
          title: "Connection Successful",
          description: "MCP server is reachable and responding.",
        });
      } else {
        setConnectionStatus(prev => ({ ...prev, [workflow.id]: 'failed' }));
        toast({
          title: "Connection Issues",
          description: "MCP server responded but may have configuration issues.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [workflow.id]: 'failed' }));
      const errorMessage = MCPService.formatMCPServerError(error);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(workflow.id);
        return newSet;
      });
    }
  };

  const handleInputSchemaChange = (id: string, schemaText: string) => {
    try {
      if (!schemaText.trim()) {
        updateWorkflow(id, 'inputSchema', null);
        return;
      }
      
      const schema = JSON.parse(schemaText);
      updateWorkflow(id, 'inputSchema', schema);
    } catch (error) {
      console.error('Invalid JSON schema:', error);
    }
  };

  const saveChanges = async () => {
    try {
      const updatedWorkflows = await Promise.all(
        editedWorkflows.map(async (workflow) => {
          // Check if workflow exists in original workflows array
          const existingWorkflow = workflows.find(w => w.id === workflow.id);
          
          if (existingWorkflow) {
            // Update existing workflow
            await DatabaseService.updateWorkflow(workflow);
            return workflow;
          } else {
            // Create new workflow
            await DatabaseService.createWorkflow(workflow);
            return workflow;
          }
        })
      );
      
      onUpdateWorkflows(updatedWorkflows);
      onClose();
      
      toast({
        title: "Changes Saved",
        description: "Workflow configurations have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving workflows:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow configurations.",
        variant: "destructive"
      });
    }
  };

  const getConnectionStatusIcon = (workflowId: string) => {
    if (testingConnections.has(workflowId)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    const status = connectionStatus[workflowId];
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Server className="h-5 w-5 text-blue-500" />
            MCP Server Configuration
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Configure your MCP servers and workflow settings. MCP servers handle the execution of your automation workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {editedWorkflows.map((workflow) => (
            <Card key={workflow.id} className="border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      Workflow Configuration
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Configure MCP server connection and workflow parameters
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWorkflow(workflow.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${workflow.id}`} className="text-gray-900">Workflow Name</Label>
                    <Input
                      id={`name-${workflow.id}`}
                      value={workflow.name}
                      onChange={(e) => updateWorkflow(workflow.id, 'name', e.target.value)}
                      placeholder="Enter workflow name"
                      className="text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`description-${workflow.id}`} className="text-gray-900">Description</Label>
                    <Input
                      id={`description-${workflow.id}`}
                      value={workflow.description}
                      onChange={(e) => updateWorkflow(workflow.id, 'description', e.target.value)}
                      placeholder="Enter workflow description"
                      className="text-gray-900"
                    />
                  </div>
                </div>

                {/* MCP Server URL */}
                <div className="space-y-2">
                  <Label htmlFor={`url-${workflow.id}`} className="text-gray-900 flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    MCP Server URL
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id={`url-${workflow.id}`}
                      value={workflow.webhookUrl}
                      onChange={(e) => updateWorkflow(workflow.id, 'webhookUrl', e.target.value)}
                      placeholder="https://your-mcp-server.com/endpoint"
                      className="flex-1 text-gray-900"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testMCPConnection(workflow)}
                      disabled={testingConnections.has(workflow.id) || !workflow.webhookUrl}
                      className="flex items-center space-x-1"
                    >
                      <TestTube className="h-4 w-4" />
                      <span>Test</span>
                      {getConnectionStatusIcon(workflow.id)}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the URL of your MCP server endpoint that will handle workflow execution.
                  </p>
                </div>

                {/* Input Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={workflow.requiresInput}
                      onCheckedChange={(checked) => updateWorkflow(workflow.id, 'requiresInput', checked)}
                    />
                    <Label className="text-gray-900">Workflow requires input parameters</Label>
                  </div>

                  {workflow.requiresInput && (
                    <div className="space-y-2">
                      <Label htmlFor={`schema-${workflow.id}`} className="text-gray-900">Input Schema (JSON)</Label>
                      <Textarea
                        id={`schema-${workflow.id}`}
                        value={workflow.inputSchema ? JSON.stringify(workflow.inputSchema, null, 2) : ''}
                        onChange={(e) => handleInputSchemaChange(workflow.id, e.target.value)}
                        placeholder={`{
  "field1": {
    "type": "text",
    "label": "Field Label",
    "placeholder": "Enter value",
    "required": true
  }
}`}
                        rows={6}
                        className="font-mono text-sm text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        Define the input fields required by this workflow in JSON format.
                      </p>
                    </div>
                  )}
                </div>

                {/* MCP Server Help */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    MCP Server Setup Guide
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Ensure your MCP server is running and accessible</li>
                    <li>• Verify the server URL is correct and includes the full endpoint path</li>
                    <li>• Use the "Test" button to verify connectivity before saving</li>
                    <li>• MCP servers should respond to both GET and POST requests</li>
                    <li>• Check MCP server logs if connections fail</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Workflow Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addWorkflow}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Workflow</span>
            </Button>
          </div>

          {/* Save Changes */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveChanges} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
