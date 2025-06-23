
-- Create workflows table to store workflow configurations
CREATE TABLE public.workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT,
  requires_input BOOLEAN DEFAULT false,
  input_schema JSONB,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 100,
  avg_execution_time INTEGER DEFAULT 0,
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow_executions table to store individual execution records
CREATE TABLE public.workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT REFERENCES public.workflows(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in milliseconds
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to update workflow statistics
CREATE OR REPLACE FUNCTION update_workflow_stats(workflow_id_param TEXT)
RETURNS void AS $$
DECLARE
  total_executions INTEGER;
  successful_executions INTEGER;
  new_success_rate DECIMAL;
  new_avg_time INTEGER;
  latest_run TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get total executions count
  SELECT COUNT(*) INTO total_executions
  FROM workflow_executions 
  WHERE workflow_id = workflow_id_param AND status != 'running';

  -- Get successful executions count
  SELECT COUNT(*) INTO successful_executions
  FROM workflow_executions 
  WHERE workflow_id = workflow_id_param AND status = 'success';

  -- Calculate success rate
  IF total_executions > 0 THEN
    new_success_rate := ROUND((successful_executions::DECIMAL / total_executions::DECIMAL) * 100, 2);
  ELSE
    new_success_rate := 100;
  END IF;

  -- Calculate average execution time (only for completed executions)
  SELECT COALESCE(AVG(duration), 0) INTO new_avg_time
  FROM workflow_executions 
  WHERE workflow_id = workflow_id_param AND status != 'running' AND duration IS NOT NULL;

  -- Get latest run time
  SELECT MAX(start_time) INTO latest_run
  FROM workflow_executions 
  WHERE workflow_id = workflow_id_param;

  -- Update workflow statistics
  UPDATE workflows 
  SET 
    execution_count = total_executions,
    success_count = successful_executions,
    success_rate = new_success_rate,
    avg_execution_time = COALESCE(new_avg_time, 0),
    last_run = latest_run,
    updated_at = now()
  WHERE id = workflow_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats when executions change
CREATE OR REPLACE FUNCTION trigger_update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_workflow_stats(OLD.workflow_id);
    RETURN OLD;
  ELSE
    PERFORM update_workflow_stats(NEW.workflow_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workflow_executions table
DROP TRIGGER IF EXISTS update_stats_trigger ON workflow_executions;
CREATE TRIGGER update_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_workflow_stats();

-- Insert default workflows if they don't exist
INSERT INTO workflows (id, name, description, webhook_url, requires_input, input_schema)
VALUES 
  ('wf-1', 'Generate Report', 'Generate daily business report', '', false, NULL),
  ('wf-2', 'Send Notifications', 'Send email notifications to team', '', true, '{"message": {"type": "text", "label": "Message", "required": true}, "recipients": {"type": "text", "label": "Recipients (comma-separated)", "required": true}}'),
  ('wf-3', 'Data Sync', 'Synchronize data between systems', '', false, NULL)
ON CONFLICT (id) DO NOTHING;
