
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

    const { webhookUrl, params, isComplexWorkflow, isTest, isMCPServer } = await req.json();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Server URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const serverType = isMCPServer ? 'MCP server' : 'N8N webhook';
    console.log(`Proxying request to ${serverType}:`, webhookUrl);
    console.log('With params:', params);
    console.log('Complex workflow mode:', isComplexWorkflow);
    console.log('Is test:', isTest);
    console.log('Is MCP server:', isMCPServer);

    // Set timeout based on workflow type and server type
    let timeout;
    if (isTest) {
      timeout = 10000; // 10s for tests
    } else if (isMCPServer) {
      timeout = isComplexWorkflow ? 12000 : 20000; // MCP servers: 12s for complex, 20s for simple
    } else {
      timeout = isComplexWorkflow ? 15000 : 30000; // N8N webhooks: 15s for complex, 30s for simple
    }
    
    console.log('Timeout:', timeout);

    let response;
    let lastError;

    // Strategy 1: Try POST request first
    try {
      console.log('Trying POST request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': isMCPServer ? 'MCP-Dashboard-Client/1.0' : 'N8N-Dashboard-Trigger/1.0',
      };

      response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(params || {}),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('POST request successful');
      } else {
        throw new Error(`POST failed with ${response.status}`);
      }
    } catch (error) {
      console.log('POST request failed:', error.message);
      lastError = error;
      
      // Strategy 2: Try GET request as fallback (works for many endpoints)
      try {
        console.log('Trying GET request as fallback...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const urlParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          Object.entries(params).forEach(([key, value]) => {
            urlParams.append(key, String(value));
          });
        }
        
        const getUrl = urlParams.toString() ? `${webhookUrl}?${urlParams.toString()}` : webhookUrl;
        
        response = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': isMCPServer ? 'MCP-Dashboard-Client/1.0' : 'N8N-Dashboard-Trigger/1.0',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('GET request successful');
        } else {
          throw new Error(`GET failed with ${response.status}`);
        }
      } catch (getError) {
        console.log('GET request also failed:', getError.message);
        response = null;
        lastError = getError;
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response received';
      const status = response ? response.status : 500;
      
      console.error(`${serverType} failed:`, { 
        status, 
        statusText: response?.statusText || 'Unknown', 
        body: errorText,
        lastError: lastError?.message
      });
      
      let errorMessage = `HTTP ${status}: ${response?.statusText || 'Unknown error'}`;
      
      if (status === 404) {
        if (isMCPServer) {
          errorMessage = 'MCP server endpoint not found. Please check that the server is running and the URL is correct.';
        } else {
          errorMessage = 'N8N webhook not registered. Please activate your workflow and execute it manually once in N8N.';
        }
      } else if (status >= 500) {
        if (isMCPServer) {
          errorMessage = 'MCP server error. Please check your server configuration and logs.';
        } else {
          errorMessage = 'N8N server error. Please check your workflow configuration.';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: status
        }),
        { 
          status: status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.text();
    console.log(`${serverType} success:`, result);
    
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
    console.error('Proxy error:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server may be taking too long to respond.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to server. Please check the URL and server availability.';
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
