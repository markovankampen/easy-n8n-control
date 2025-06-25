
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

    // For complex workflows, try different strategies
    let response;
    let lastError;

    // Strategy 1: Standard POST request
    try {
      console.log('Trying POST request...');
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8N-Dashboard-Trigger/1.0',
        },
        body: JSON.stringify(params || {}),
      });

      if (response.ok) {
        console.log('POST request successful');
      } else {
        throw new Error(`POST failed with ${response.status}`);
      }
    } catch (error) {
      console.log('POST request failed:', error.message);
      lastError = error;
      
      // Strategy 2: GET request as fallback
      try {
        console.log('Trying GET request as fallback...');
        const urlParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            urlParams.append(key, String(value));
          });
        }
        
        const getUrl = urlParams.toString() ? `${webhookUrl}?${urlParams.toString()}` : webhookUrl;
        
        response = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'N8N-Dashboard-Trigger/1.0',
          },
        });

        if (response.ok) {
          console.log('GET request successful');
        } else {
          throw new Error(`GET failed with ${response.status}`);
        }
      } catch (getError) {
        console.log('GET request also failed:', getError.message);
        
        // Strategy 3: For complex workflows, try with minimal payload
        if (isComplexWorkflow) {
          try {
            console.log('Trying minimal payload for complex workflow...');
            response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'N8N-Dashboard-Trigger/1.0',
              },
              body: JSON.stringify({ trigger: true, timestamp: Date.now() }),
            });

            if (!response.ok) {
              throw new Error(`Minimal payload failed with ${response.status}`);
            }
            console.log('Minimal payload request successful');
          } catch (minimalError) {
            console.log('All strategies failed');
            response = null;
            lastError = minimalError;
          }
        } else {
          response = null;
        }
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response received';
      const status = response ? response.status : 500;
      
      console.error('N8N webhook failed after all strategies:', { 
        status, 
        statusText: response?.statusText || 'Unknown', 
        body: errorText,
        lastError: lastError?.message
      });
      
      let errorMessage = `HTTP ${status}: ${response?.statusText || 'Unknown error'}`;
      
      if (status === 404) {
        if (errorText.includes('not registered')) {
          errorMessage = isComplexWorkflow 
            ? 'Complex N8N workflow not registered. Please: 1) Activate the workflow, 2) Execute it manually once, 3) Then try again.'
            : 'N8N webhook not registered. Please activate your workflow or click "Test workflow" in N8N first.';
        } else {
          errorMessage = isComplexWorkflow
            ? 'Complex workflow webhook not found. Ensure workflow is activated and has been executed at least once.'
            : 'Webhook not found. Please check the URL and ensure your N8N workflow is activated.';
        }
      } else if (status >= 500) {
        errorMessage = isComplexWorkflow
          ? 'N8N server error. Complex workflows may have timeout or configuration issues. Check N8N logs.'
          : 'N8N server error. Please check your workflow configuration.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: status,
          isComplexWorkflow
        }),
        { 
          status: status, 
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
      parsedResult = { message: result };
    }

    return new Response(
      JSON.stringify(parsedResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

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
