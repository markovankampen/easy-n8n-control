export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow via proxy:', { webhookUrl, params });
      
      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl, 
          params,
          isComplexWorkflow: true // Flag for complex workflow handling
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Proxy error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Workflow response:', result);
      
      return result;
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  static async testConnection(webhookUrl: string): Promise<boolean> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Testing webhook connection via proxy:', webhookUrl);
      
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from N8N Dashboard'
      };

      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl, 
          params: testPayload 
        })
      });

      console.log('Test response status:', response.status);
      
      return response.status < 500; // Accept 200s, 300s, 400s but not 500s
    } catch (error) {
      console.error('Connection test failed:', error);
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
      if (error.message.includes('not registered')) {
        return 'N8N webhook not ready. For complex workflows: 1) Activate the workflow, 2) Execute it once manually, 3) Then try triggering from dashboard.';
      }
      
      if (error.message.includes('not found')) {
        return 'Webhook not found. For complex workflows, ensure the workflow is both activated AND has been executed at least once.';
      }
      
      if (error.message.includes('500')) {
        return 'N8N server error: Complex workflows may have execution timeouts or node configuration issues.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred while calling the webhook.';
  }
}
