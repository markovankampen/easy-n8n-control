
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
    
    if (method === 'POST') {
      // Try POST request first
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      // If we get a 404 with specific message about POST not being registered, try GET
      if (!response.ok && response.status === 404) {
        const errorText = await response.text();
        if (errorText.includes('not registered for POST requests')) {
          console.log('POST not supported, trying GET request');
          
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
            },
          });
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
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook request failed:', { 
        status: response.status, 
        statusText: response.statusText,
        errorText 
      });
      
      return new Response(
        JSON.stringify({ 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
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
