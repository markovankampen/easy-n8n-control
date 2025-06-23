
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl, params, method = 'POST' } = await req.json();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Proxying webhook request:', { webhookUrl, method, params });

    let response;
    let lastError = null;
    
    if (method === 'POST') {
      // Try POST request first
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
          },
          body: JSON.stringify(params || {}),
        });

        // If POST succeeds, use it
        if (response.ok) {
          console.log('POST request successful');
        } else {
          lastError = `POST failed with ${response.status}: ${response.statusText}`;
          console.log(lastError);
        }
      } catch (error) {
        lastError = `POST request failed: ${error.message}`;
        console.log(lastError);
        response = null;
      }

      // If POST didn't work, try GET
      if (!response || !response.ok) {
        console.log('Trying GET request as fallback');
        
        try {
          // Convert params to URL search params for GET request
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
              'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
            },
          });

          if (response.ok) {
            console.log('GET request successful');
          } else {
            console.log(`GET also failed with ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.log(`GET request failed: ${error.message}`);
        }
      }
    } else if (method === 'GET') {
      // Handle GET request
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
          'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
        },
      });
    }

    if (!response || !response.ok) {
      console.error('All webhook requests failed:', { 
        status: response?.status || 'No response', 
        statusText: response?.statusText || 'Network error',
        lastError
      });
      
      // Try to get error details
      let errorText = '';
      try {
        if (response) {
          errorText = await response.text();
        }
      } catch (err) {
        console.log('Could not read error response body:', err);
        errorText = 'No error details available';
      }
      
      // Provide helpful error messages based on common N8N issues
      let userFriendlyError = '';
      if (response?.status === 404) {
        userFriendlyError = 'Webhook not found (404). Please check: 1) Is your N8N workflow activated? 2) Is the webhook URL correct? 3) If you connected nodes to your webhook trigger, the URL might have changed.';
      } else if (response?.status === 500) {
        userFriendlyError = 'N8N workflow execution error (500). Check your workflow for errors in the N8N interface.';
      } else if (!response) {
        userFriendlyError = 'Could not connect to webhook URL. Please verify the URL is accessible.';
      } else {
        userFriendlyError = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyError,
          details: errorText,
          status: response?.status || 0,
          lastError
        }),
        { 
          status: response?.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Try to parse JSON response, but handle cases where it might not be JSON
    let result;
    try {
      const responseText = await response.text();
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          // If it's not JSON, return the text as a message
          result = { message: responseText };
        }
      } else {
        result = { message: 'Webhook executed successfully' };
      }
    } catch (err) {
      console.error('Error reading response:', err);
      result = { message: 'Webhook executed successfully' };
    }

    console.log('Webhook response received:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook proxy error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network error: Unable to reach webhook URL. Please check the URL and ensure it\'s accessible.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
