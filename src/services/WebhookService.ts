
export class WebhookService {
  static async triggerWorkflow(webhookUrl: string, params?: any): Promise<any> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    try {
      console.log('Triggering workflow via proxy:', { webhookUrl, params });
      
      // Detect if this is likely a complex workflow based on URL patterns
      const isComplexWorkflow = this.isLikelyComplexWorkflow(webhookUrl);
      
      console.log('Detected workflow type:', isComplexWorkflow ? 'complex' : 'simple');
      
      // Use appropriate timeout based on workflow complexity
      const timeoutMs = isComplexWorkflow ? 8000 : 15000; // 8s for complex, 15s for simple
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl, 
          params,
          isComplexWorkflow
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Proxy error:', errorData);
        
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = isComplexWorkflow 
            ? 'Complex N8N workflow not found (404). Please ensure:\n\n' +
              '1. Your N8N workflow is ACTIVATED\n' +
              '2. The workflow has been executed at least once manually\n' +
              '3. For complex workflows: Add "Respond to Webhook" node immediately after the webhook trigger\n' +
              '4. Set Response Mode to "Using \'Respond to Webhook\' Node"\n' +
              '5. The "Respond to Webhook" node should return a simple success message'
            : 'N8N Webhook not found (404). Please ensure:\n\n' +
              '1. Your N8N workflow is ACTIVATED\n' +
              '2. The workflow has been executed at least once manually\n' +
              '3. The webhook URL is correct';
        } else if (response.status >= 500) {
          errorMessage = 'N8N Server Error (500+). This usually means:\n\n' +
            '1. N8N server is experiencing issues\n' +
            '2. Workflow has configuration problems\n' +
            '3. Check N8N logs for more details';
        } else if (response.status === 408) {
          errorMessage = isComplexWorkflow 
            ? 'Complex workflow timed out, but this may be expected. Check N8N execution logs to verify the workflow is running.'
            : 'Simple workflow timed out. This indicates a configuration issue - simple workflows should respond quickly.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Workflow response:', result);
      
      return result;
    } catch (error) {
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        console.log('Workflow trigger timed out');
        
        // For complex workflows, timeout might be acceptable
        const isComplexWorkflow = this.isLikelyComplexWorkflow(webhookUrl);
        if (isComplexWorkflow) {
          return { 
            status: 'started', 
            message: 'Complex workflow started (timeout is normal for long workflows)',
            note: 'Check N8N execution logs to monitor progress',
            executionId: `timeout-${Date.now()}`
          };
        } else {
          throw new Error('Simple workflow timed out - this indicates a configuration issue');
        }
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
          params: testPayload,
          isComplexWorkflow: this.isLikelyComplexWorkflow(webhookUrl)
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

  static isLikelyComplexWorkflow(webhookUrl: string): boolean {
    // This is a heuristic - in practice, you might want to let users configure this
    // or detect it based on workflow metadata
    
    // For now, we'll assume workflows with certain patterns are complex
    // You could enhance this by:
    // 1. Checking if the webhook URL contains certain keywords
    // 2. Looking at execution history
    // 3. Having users explicitly mark workflows as complex
    
    const url = webhookUrl.toLowerCase();
    
    // Keywords that might indicate complex workflows
    const complexIndicators = [
      'chain', 'flow', 'process', 'pipeline', 'complex', 'multi', 'sequence'
    ];
    
    return complexIndicators.some(indicator => url.includes(indicator));
  }

  static formatWebhookError(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('not registered') || error.message.includes('404')) {
        return 'N8N webhook not ready. To fix this:\n\n' +
          '1. Go to your N8N workflow\n' +
          '2. Make sure it\'s ACTIVATED (toggle switch on)\n' +
          '3. Execute the workflow manually once (click "Test workflow")\n' +
          '4. For complex workflows: Add "Respond to Webhook" node immediately after the webhook trigger\n' +
          '5. Set Response Mode to "Using \'Respond to Webhook\' Node"\n' +
          '6. The "Respond to Webhook" node should return: {"status": "started", "message": "Workflow running"}\n\n' +
          'This setup allows complex workflows to respond immediately while processing continues in the background.';
      }
      
      if (error.message.includes('500')) {
        return 'N8N server error. Possible causes:\n\n' +
          '1. Workflow has configuration issues\n' +
          '2. N8N server is overloaded or down\n' +
          '3. Execution timeout occurred\n' +
          '4. Check N8N server logs for details';
      }
      
      if (error.message.includes('timeout')) {
        return 'Workflow timed out. For complex workflows:\n\n' +
          '1. This might be normal - check N8N execution logs\n' +
          '2. Add "Respond to Webhook" node for immediate response\n' +
          '3. Use shorter, focused workflows when possible\n' +
          '4. Check if all nodes in the workflow are properly configured';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred while calling the webhook.';
  }
}
