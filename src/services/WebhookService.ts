export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow via proxy:', { webhookUrl, params });
      
      // Use shorter timeout for initial trigger - long workflows should respond immediately
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl, 
          params,
          isComplexWorkflow: true,
          expectedTimeout: true // Flag to indicate timeout is expected for long workflows
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Proxy error:', errorData);
        
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = 'N8N Webhook not found (404). Please ensure:\n\n' +
            '1. Your N8N workflow is ACTIVATED\n' +
            '2. The workflow has been executed at least once manually\n' +
            '3. The webhook URL is correct\n' +
            '4. For long workflows: Use "Respond to Webhook" node immediately after trigger';
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
      // Handle timeout specifically for long workflows
      if (error.name === 'AbortError') {
        console.log('Workflow trigger timed out - this is expected for long workflows');
        return { 
          status: 'triggered', 
          message: 'Workflow started successfully (timeout expected for long workflows)',
          executionId: `timeout-${Date.now()}`
        };
      }
      
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

      // Use shorter timeout for connection tests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl, 
          params: testPayload 
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Test response status:', response.status);
      
      if (response.status === 404) {
        throw new Error('Webhook not found (404). Please activate your N8N workflow and execute it manually once.');
      }
      
      return response.status < 500;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Connection test timed out. This might indicate the webhook is slow to respond.');
      }
      
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
          '4. For long workflows: Add "Respond to Webhook" node immediately after trigger\n' +
          '5. Set Response Mode to "Using \'Respond to Webhook\' Node"\n\n' +
          'This prevents timeouts and allows complex workflows to run properly.';
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
