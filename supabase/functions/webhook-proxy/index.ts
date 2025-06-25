
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { webhookUrl, params, isComplexWorkflow } = await req.json();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying webhook request to:', webhookUrl);
    console.log('With params:', params);
    console.log('Complex workflow mode:', isComplexWorkflow);

    // Use more reasonable timeouts - 10s for complex, 18s for simple
    const timeoutMs = isComplexWorkflow ? 10000 : 18000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`Using ${timeoutMs}ms timeout for ${isComplexWorkflow ? 'complex' : 'simple'} workflow`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8N-Dashboard-Trigger/2.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params || {}),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`N8N webhook failed with status ${response.status}`);
        const errorText = await response.text();
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = 'N8N webhook not found (404). Please ensure:\n\n' +
            '1. Your N8N workflow is ACTIVATED\n' +
            '2. The workflow has been executed at least once manually\n' +
            '3. The webhook URL is correct';
        } else if (response.status >= 500) {
          errorMessage = 'N8N server error. Check your workflow configuration and N8N server logs.';
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: errorText,
            status: response.status,
            isComplexWorkflow
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const result = await response.text();
      console.log('N8N webhook success:', result);
      
      // Try to parse as JSON, fallback to text
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch {
        parsedResult = { 
          message: result || 'Workflow triggered successfully',
          status: 'success',
          timestamp: new Date().toISOString()
        };
      }

      // For complex workflows, ensure we indicate successful start
      if (isComplexWorkflow && !parsedResult.status) {
        parsedResult = {
          ...parsedResult,
          status: 'started',
          message: parsedResult.message || 'Complex workflow started successfully',
          note: 'Workflow is running in background'
        };
      }

      return new Response(
        JSON.stringify(parsedResult),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.log(`Workflow timed out after ${timeoutMs}ms`);
        
        if (isComplexWorkflow) {
          // For complex workflows, timeout is expected and acceptable
          return new Response(
            JSON.stringify({ 
              status: 'started',
              message: 'Complex workflow started (timeout expected)',
              note: 'Workflow continues running in N8N',
              executionId: `timeout-${Date.now()}`
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          // For simple workflows, timeout indicates a problem
          return new Response(
            JSON.stringify({ 
              error: 'Workflow timed out - this may indicate a configuration issue',
              suggestion: 'Check if workflow is properly activated and responding',
              timeout: timeoutMs
            }),
            { 
              status: 408, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      throw error; // Re-throw non-timeout errors
    }

  } catch (error) {
    console.error('Webhook proxy error:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to N8N webhook. Please check the URL and N8N instance availability.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
