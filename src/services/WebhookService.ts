
import { supabase } from "@/integrations/supabase/client";

export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow via proxy:', { webhookUrl, params });
      
      const { data, error } = await supabase.functions.invoke('webhook-proxy', {
        body: {
          webhookUrl,
          params: params || {},
          method: 'POST'
        }
      });

      if (error) {
        console.error('Proxy function error:', error);
        throw new Error(`Proxy error: ${error.message}`);
      }

      if (data?.error) {
        console.error('Webhook error from proxy:', data.error);
        throw new Error(data.error);
      }

      console.log('Workflow response via proxy:', data);
      return data;
    } catch (error) {
      console.error('Webhook service error:', error);
      throw error;
    }
  }

  static async testConnection(webhookUrl: string): Promise<boolean> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Testing webhook connection via proxy:', webhookUrl);
      
      // Send a test payload
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from N8N Dashboard'
      };

      const { data, error } = await supabase.functions.invoke('webhook-proxy', {
        body: {
          webhookUrl,
          params: testPayload,
          method: 'POST'
        }
      });

      if (error) {
        console.error('Test connection proxy error:', error);
        throw new Error(`Test failed: ${error.message}`);
      }

      if (data?.error) {
        // If POST fails, try GET
        console.log('POST test failed, trying GET request');
        
        const { data: getData, error: getError } = await supabase.functions.invoke('webhook-proxy', {
          body: {
            webhookUrl,
            params: { test: 'true', timestamp: new Date().toISOString() },
            method: 'GET'
          }
        });

        if (getError || getData?.error) {
          console.error('GET test also failed:', getError || getData?.error);
          throw new Error(getData?.error || getError?.message || 'Connection test failed');
        }
      }

      console.log('Test connection successful via proxy');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
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
