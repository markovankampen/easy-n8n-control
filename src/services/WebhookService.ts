
export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow:', { webhookUrl, params });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      if (!response.ok) {
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

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      // Accept any response code as long as the request went through
      // Some webhooks might return 404 or other codes but still be reachable
      console.log('Test response status:', response.status);
      
      return true;
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
