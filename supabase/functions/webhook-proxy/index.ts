
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

    const { webhookUrl, params, isComplexWorkflow, isTest, timeout = 30000 } = await req.json();

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
    console.log('Is test:', isTest);
    console.log('Timeout:', timeout);

    // Set appropriate timeout based on workflow type
    const fetchTimeout = isTest ? 10000 : (isComplexWorkflow ? 15000 : timeout);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8N-Dashboard-Trigger/1.0',
        },
        body: JSON.stringify(params || {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('N8N webhook failed:', { 
          status: response.status, 
          statusText: response.statusText, 
          body: errorText 
        });
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          if (errorText.includes('not registered')) {
            errorMessage = isComplexWorkflow 
              ? 'Complex N8N workflow not registered. Please: 1) Activate the workflow, 2) Execute it manually once, 3) Add "Respond to Webhook" node for immediate response.'
              : 'N8N webhook not registered. Please activate your workflow and execute it manually once in N8N.';
          } else {
            errorMessage = 'Webhook not found. Please check the URL and ensure your N8N workflow is activated.';
          }
        } else if (response.status >= 500) {
          errorMessage = 'N8N server error. Please check your workflow configuration and N8N server status.';
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
        parsedResult = { message: result || 'Workflow executed successfully' };
      }

      return new Response(
        JSON.stringify(parsedResult),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Webhook request timed out after', fetchTimeout, 'ms');
        
        if (isComplexWorkflow) {
          // For complex workflows, timeout might be expected
          return new Response(
            JSON.stringify({ 
              status: 'triggered',
              message: 'Complex workflow started (may continue running in background)',
              timeout: true
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          // For simple workflows, timeout is an error
          return new Response(
            JSON.stringify({ 
              error: 'Webhook request timed out. Please check your N8N workflow configuration.',
              timeout: true
            }),
            { 
              status: 408, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      console.error('Fetch error:', fetchError);
      throw fetchError;
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
