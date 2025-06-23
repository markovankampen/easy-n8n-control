
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

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (urlError) {
      console.error('Invalid webhook URL format:', webhookUrl);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid webhook URL format',
          details: 'Please check that your webhook URL is properly formatted'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let response;
    let lastError = null;
    
    if (method === 'POST') {
      // Try POST request first
      try {
        console.log('Making POST request to:', webhookUrl);
        response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
          },
          body: JSON.stringify(params || {}),
        });

        console.log('POST response status:', response.status, response.statusText);

        // If POST succeeds, use it
        if (response.ok) {
          console.log('POST request successful');
        } else {
          lastError = `POST failed with ${response.status}: ${response.statusText}`;
          console.log(lastError);
        }
      } catch (error) {
        lastError = `POST request failed: ${error.message}`;
        console.error('POST fetch error:', error);
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
          console.log('Making GET request to:', getUrl);
          
          response = await fetch(getUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
            },
          });

          console.log('GET response status:', response.status, response.statusText);

          if (response.ok) {
            console.log('GET request successful');
          } else {
            console.log(`GET also failed with ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.error('GET fetch error:', error);
          lastError = `Both POST and GET requests failed. Last error: ${error.message}`;
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
      console.log('Making GET request to:', getUrl);
      
      try {
        response = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'N8N-Dashboard-Webhook-Proxy/1.0',
          },
        });
        console.log('GET response status:', response.status, response.statusText);
      } catch (error) {
        console.error('GET fetch error:', error);
        lastError = `GET request failed: ${error.message}`;
      }
    }

    if (!response || !response.ok) {
      console.error('All webhook requests failed:', { 
        status: response?.status || 'No response', 
        statusText: response?.statusText || 'Network error',
        lastError,
        webhookUrl
      });
      
      // Try to get error details
      let errorText = '';
      try {
        if (response) {
          errorText = await response.text();
          console.log('Error response body:', errorText);
        }
      } catch (err) {
        console.log('Could not read error response body:', err);
        errorText = 'No error details available';
      }
      
      // Provide detailed error messages
      let userFriendlyError = '';
      if (!response) {
        userFriendlyError = `Unable to reach webhook URL: ${webhookUrl}. Please check: 1) Is your N8N instance running and accessible? 2) Is the URL correct? 3) Are there any network restrictions?`;
      } else if (response.status === 404) {
        userFriendlyError = `Webhook not found (404): ${webhookUrl}. Please check: 1) Is your N8N workflow activated? 2) Is the webhook URL correct? 3) Did the URL change after connecting nodes to your webhook trigger?`;
      } else if (response.status === 500) {
        userFriendlyError = `N8N workflow execution error (500). Check your workflow for errors in the N8N interface. URL: ${webhookUrl}`;
      } else if (response.status >= 400 && response.status < 500) {
        userFriendlyError = `Client error (${response.status}): ${response.statusText}. URL: ${webhookUrl}`;
      } else if (response.status >= 500) {
        userFriendlyError = `Server error (${response.status}): ${response.statusText}. URL: ${webhookUrl}`;
      } else {
        userFriendlyError = `HTTP ${response.status}: ${response.statusText}. URL: ${webhookUrl}`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyError,
          details: errorText,
          status: response?.status || 0,
          lastError,
          webhookUrl: webhookUrl
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
      console.log('Response received:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
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

    console.log('Webhook response processed successfully');

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
      errorMessage = 'Network error: Unable to reach webhook URL. Please check the URL and ensure your N8N instance is accessible.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack || 'No additional details available'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
