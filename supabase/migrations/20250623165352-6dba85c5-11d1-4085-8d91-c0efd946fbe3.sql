
-- Enable real-time updates for workflows and workflow_executions tables
ALTER TABLE public.workflows REPLICA IDENTITY FULL;
ALTER TABLE public.workflow_executions REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;

-- Update the delete workflow function to ensure cascade deletion
CREATE OR REPLACE FUNCTION delete_workflow_cascade(workflow_id_param text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete all executions for this workflow
  DELETE FROM workflow_executions WHERE workflow_id = workflow_id_param;
  
  -- Delete the workflow
  DELETE FROM workflows WHERE id = workflow_id_param;
END;
$$;
