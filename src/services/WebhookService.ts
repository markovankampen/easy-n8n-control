
export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow directly:', { webhookUrl, params });
      
      // First try POST request
      let response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      // If we get a 404, the webhook might not be registered - try GET as fallback
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
        console.error('Webhook request failed:', { status: response.status, statusText: response.statusText, body: errorText });
        
        if (response.status === 404) {
          throw new Error('Webhook not found (404). Please check: 1) Is your N8N workflow activated? 2) Is the webhook URL correct? 3) Did the URL change after connecting nodes to your webhook trigger?');
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Workflow response:', result);
      
      return result;
    } catch (error) {
      console.error('Webhook error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach webhook URL. Please check the URL and your internet connection.');
      }
      
      throw error;
    }
  }

  static async testConnection(webhookUrl: string): Promise<boolean> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Testing webhook connection:', webhookUrl);
      
      // Send a test payload
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from N8N Dashboard'
      };

      // First try POST
      let response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      // If POST fails with 404, try GET
      if (!response.ok && response.status === 404) {
        console.log('POST not supported for test, trying GET request');
        
        response = await fetch(`${webhookUrl}?test=true&timestamp=${encodeURIComponent(new Date().toISOString())}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Accept any response code as long as the request went through
      console.log('Test response status:', response.status);
      
      return response.status < 500; // Accept 200s, 300s, 400s but not 500s
    } catch (error) {
      console.error('Connection test failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Connection failed: Unable to reach the webhook URL. Please verify the URL is correct and accessible.');
      }
      
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateWebhookUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static formatWebhookError(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        return 'Network connection failed. Please check your internet connection and webhook URL.';
      }
      
      if (error.message.includes('CORS')) {
        return 'CORS error: The webhook endpoint may need to allow cross-origin requests.';
      }
      
      if (error.message.includes('404')) {
        return 'Webhook not found. Please verify the URL is correct and the N8N workflow is active.';
      }
      
      if (error.message.includes('500')) {
        return 'Server error: There may be an issue with your N8N workflow execution.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred while calling the webhook.';
  }
}
