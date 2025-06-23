
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

    const { webhookUrl, params } = await req.json();

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

    // First try POST request
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });

    // If POST fails with 404, try GET as fallback
    if (!response.ok && response.status === 404) {
      console.log('POST failed with 404, trying GET request');
      
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
          errorMessage = 'N8N webhook not registered. Please activate your workflow or click "Test workflow" in N8N first.';
        } else {
          errorMessage = 'Webhook not found. Please check the URL and ensure your N8N workflow is activated.';
        }
      } else if (response.status >= 500) {
        errorMessage = 'N8N server error. Please check your workflow configuration.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: response.status
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
