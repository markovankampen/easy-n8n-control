
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
        
        // Provide more specific error messages based on the response
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = 'N8N Webhook not found (404). Please ensure:\n\n' +
            '1. Your N8N workflow is ACTIVATED\n' +
            '2. The workflow has been executed at least once manually\n' +
            '3. The webhook URL is correct\n' +
            '4. For complex workflows: Execute the workflow manually in N8N first';
        } else if (response.status >= 500) {
          errorMessage = 'N8N Server Error (500+). This usually means:\n\n' +
            '1. N8N server is experiencing issues\n' +
            '2. Workflow has configuration problems\n' +
            '3. Timeout occurred during execution\n' +
            '4. Check N8N logs for more details';
        }
        
        throw new Error(errorMessage);
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
      
      if (response.status === 404) {
        throw new Error('Webhook not found (404). Please activate your N8N workflow and execute it manually once.');
      }
      
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
      if (error.message.includes('not registered') || error.message.includes('404')) {
        return 'N8N webhook not ready. To fix this:\n\n' +
          '1. Go to your N8N workflow\n' +
          '2. Make sure it\'s ACTIVATED (toggle switch on)\n' +
          '3. Execute the workflow manually once (click "Test workflow")\n' +
          '4. Then try triggering from dashboard again\n\n' +
          'For complex workflows, manual execution is required to register the webhook.';
      }
      
      if (error.message.includes('500')) {
        return 'N8N server error. Possible causes:\n\n' +
          '1. Workflow has configuration issues\n' +
          '2. N8N server is overloaded or down\n' +
          '3. Execution timeout occurred\n' +
          '4. Check N8N server logs for details';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred while calling the webhook.';
  }
}
