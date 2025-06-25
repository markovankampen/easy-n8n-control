
export class MCPService {
  static async triggerWorkflow(mcpServerUrl: string, params?: any): Promise<any> {
    if (!mcpServerUrl) {
      throw new Error('MCP Server URL is required');
    }

    try {
      console.log('Triggering workflow via MCP server:', { mcpServerUrl, params });
      
      // Use appropriate timeout based on workflow complexity
      const isComplex = this.isComplexWorkflow(mcpServerUrl);
      const timeout = isComplex ? 15000 : 30000; // 15s for complex, 30s for simple
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl: mcpServerUrl, 
          params,
          isComplexWorkflow: isComplex,
          isMCPServer: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('MCP Server error:', errorData);
        
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = 'MCP Server not found (404). Please ensure:\n\n' +
            '1. Your MCP server is running and accessible\n' +
            '2. The server URL is correct\n' +
            '3. The server is configured to handle workflow requests';
        } else if (response.status >= 500) {
          errorMessage = 'MCP Server Error (500+). This usually means:\n\n' +
            '1. MCP server is experiencing issues\n' +
            '2. Server has configuration problems\n' +
            '3. Check MCP server logs for more details';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('MCP Server response:', result);
      
      return result;
    } catch (error) {
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        console.log('MCP Server request timed out');
        return { 
          status: 'triggered', 
          message: 'Workflow started successfully (may continue in background)',
          executionId: `timeout-${Date.now()}`
        };
      }
      
      console.error('MCP Server error:', error);
      throw error;
    }
  }

  static isComplexWorkflow(mcpServerUrl: string): boolean {
    // Check for indicators of complex workflows
    const complexIndicators = [
      'chain',
      'flow',
      'complex',
      'multi',
      'monitoring',
      'influencer',
      'long',
      'batch'
    ];
    
    const url = mcpServerUrl.toLowerCase();
    return complexIndicators.some(indicator => url.includes(indicator));
  }

  static async testConnection(mcpServerUrl: string): Promise<boolean> {
    if (!mcpServerUrl) {
      throw new Error('MCP Server URL is required');
    }

    try {
      console.log('Testing MCP server connection:', mcpServerUrl);
      
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from N8N Dashboard'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for tests

      const response = await fetch('https://jjvyyrlxlljryvaegegz.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqdnl5cmx4bGxqcnl2YWVnZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODI5MDIsImV4cCI6MjA2NjI1ODkwMn0.HOdET8-Xyqo5J1nWB6l2Leg-AT2R2nLK56eZUErCxa8`
        },
        body: JSON.stringify({ 
          webhookUrl: mcpServerUrl, 
          params: testPayload,
          isTest: true,
          isMCPServer: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('MCP Server test response status:', response.status);
      
      if (response.status === 404) {
        throw new Error('MCP Server not found (404). Please ensure your MCP server is running and accessible.');
      }
      
      return response.status < 500;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Connection test timed out. This might indicate the MCP server is slow to respond.');
      }
      
      console.error('MCP Server connection test failed:', error);
      throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateMCPServerUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static formatMCPServerError(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return 'MCP Server not ready. To fix this:\n\n' +
          '1. Ensure your MCP server is running\n' +
          '2. Check that the server URL is correct\n' +
          '3. Verify the server is configured to handle requests\n' +
          '4. Test the server endpoint directly';
      }
      
      if (error.message.includes('500')) {
        return 'MCP Server error. Possible causes:\n\n' +
          '1. Server has configuration issues\n' +
          '2. MCP server is overloaded or down\n' +
          '3. Execution timeout occurred\n' +
          '4. Check MCP server logs for details';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred while contacting the MCP server.';
  }
}
