
import { supabase } from "@/integrations/supabase/client";
import { Workflow, WorkflowExecution } from "../pages/Index";

export class DatabaseService {
  static async getWorkflows(): Promise<Workflow[]> {
    console.log('Fetching workflows from database...');
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }

    console.log('Fetched workflows:', data?.length || 0);
    return data.map(this.mapDatabaseToWorkflow);
  }

  static async getExecutions(): Promise<WorkflowExecution[]> {
    console.log('Fetching executions from database...');
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching executions:', error);
      return [];
    }

    console.log('Fetched executions:', data?.length || 0);
    return data.map(this.mapDatabaseToExecution);
  }

  static async createExecution(execution: WorkflowExecution): Promise<void> {
    console.log('Creating execution in database:', { 
      id: execution.id, 
      workflowId: execution.workflowId, 
      workflowName: execution.workflowName 
    });

    const { error } = await supabase
      .from('workflow_executions')
      .insert({
        id: execution.id,
        workflow_id: execution.workflowId,
        workflow_name: execution.workflowName,
        status: execution.status,
        start_time: execution.startTime.toISOString(),
        end_time: execution.endTime?.toISOString(),
        duration: execution.duration,
        result: execution.result,
        error: execution.error
      });

    if (error) {
      console.error('Error creating execution:', error);
      throw error;
    }

    console.log('Execution created successfully in database');
  }

  static async updateExecution(execution: WorkflowExecution): Promise<void> {
    console.log('Updating execution in database:', { 
      id: execution.id, 
      workflowId: execution.workflowId, 
      status: execution.status 
    });

    const { error } = await supabase
      .from('workflow_executions')
      .update({
        status: execution.status,
        end_time: execution.endTime?.toISOString(),
        duration: execution.duration,
        result: execution.result,
        error: execution.error
      })
      .eq('id', execution.id);

    if (error) {
      console.error('Error updating execution:', error);
      throw error;
    }

    console.log('Execution updated successfully in database');
  }

  static async updateWorkflowWebhookUrl(workflowId: string, webhookUrl: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({ webhook_url: webhookUrl })
      .eq('id', workflowId);

    if (error) {
      console.error('Error updating workflow webhook URL:', error);
      throw error;
    }
  }

  static async createWorkflow(workflow: Omit<Workflow, 'status' | 'executionCount' | 'successRate' | 'avgExecutionTime' | 'lastRun'>): Promise<void> {
    console.log('Creating workflow in database:', { id: workflow.id, name: workflow.name });

    const { error } = await supabase
      .from('workflows')
      .insert({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        webhook_url: workflow.webhookUrl,
        requires_input: workflow.requiresInput,
        input_schema: workflow.inputSchema
      });

    if (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }

    console.log('Workflow created successfully in database');
  }

  static async updateWorkflow(workflow: Workflow): Promise<void> {
    console.log('Updating workflow in database:', { id: workflow.id, name: workflow.name });

    const { error } = await supabase
      .from('workflows')
      .update({
        name: workflow.name,
        description: workflow.description,
        webhook_url: workflow.webhookUrl,
        requires_input: workflow.requiresInput,
        input_schema: workflow.inputSchema
      })
      .eq('id', workflow.id);

    if (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }

    console.log('Workflow updated successfully in database');
  }

  static async deleteWorkflow(workflowId: string): Promise<void> {
    console.log('Deleting workflow and all related data:', { workflowId });

    // Use the cascade deletion function
    const { error } = await supabase.rpc('delete_workflow_cascade', {
      workflow_id_param: workflowId
    });

    if (error) {
      console.error('Error deleting workflow with cascade:', error);
      throw error;
    }

    console.log('Workflow and all related data deleted successfully');
  }

  static mapDatabaseToWorkflow(dbWorkflow: any): Workflow {
    return {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      description: dbWorkflow.description,
      webhookUrl: dbWorkflow.webhook_url || '',
      status: 'idle',
      lastRun: dbWorkflow.last_run ? new Date(dbWorkflow.last_run) : undefined,
      executionCount: dbWorkflow.execution_count || 0,
      successRate: parseFloat(dbWorkflow.success_rate) || 100,
      avgExecutionTime: dbWorkflow.avg_execution_time || 0,
      requiresInput: dbWorkflow.requires_input || false,
      inputSchema: dbWorkflow.input_schema
    };
  }

  static mapDatabaseToExecution(dbExecution: any): WorkflowExecution {
    return {
      id: dbExecution.id,
      workflowId: dbExecution.workflow_id,
      workflowName: dbExecution.workflow_name,
      status: dbExecution.status,
      startTime: new Date(dbExecution.start_time),
      endTime: dbExecution.end_time ? new Date(dbExecution.end_time) : undefined,
      duration: dbExecution.duration,
      result: dbExecution.result,
      error: dbExecution.error
    };
  }
}
