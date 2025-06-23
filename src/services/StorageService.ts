import { Workflow, WorkflowExecution } from '../pages/Index';

const STORAGE_KEYS = {
  WORKFLOWS: 'n8n_dashboard_workflows',
  EXECUTIONS: 'n8n_dashboard_executions',
  SETTINGS: 'n8n_dashboard_settings'
};

const MAX_EXECUTIONS = 100; // Keep only the latest 100 executions

export class StorageService {
  static getWorkflows(): Workflow[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
      if (!data) return [];
      
      const workflows = JSON.parse(data);
      
      // Ensure all workflows have the required structure
      return workflows.map((workflow: any) => ({
        ...workflow,
        status: workflow.status || 'idle',
        executionCount: workflow.executionCount || 0,
        successRate: workflow.successRate || 100,
        avgExecutionTime: workflow.avgExecutionTime || 0,
        requiresInput: workflow.requiresInput || false,
        lastRun: workflow.lastRun ? new Date(workflow.lastRun) : undefined
      }));
    } catch (error) {
      console.error('Error loading workflows from storage:', error);
      return [];
    }
  }

  static saveWorkflows(workflows: Workflow[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
      console.log('Workflows saved to storage');
    } catch (error) {
      console.error('Error saving workflows to storage:', error);
    }
  }

  static getExecutions(): WorkflowExecution[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXECUTIONS);
      if (!data) return [];
      
      const executions = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return executions.map((execution: any) => ({
        ...execution,
        startTime: new Date(execution.startTime),
        endTime: execution.endTime ? new Date(execution.endTime) : undefined
      }));
    } catch (error) {
      console.error('Error loading executions from storage:', error);
      return [];
    }
  }

  static saveExecutions(executions: WorkflowExecution[]): void {
    try {
      // Keep only the latest executions to prevent storage bloat
      const limitedExecutions = executions
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, MAX_EXECUTIONS);
      
      localStorage.setItem(STORAGE_KEYS.EXECUTIONS, JSON.stringify(limitedExecutions));
      console.log(`Saved ${limitedExecutions.length} executions to storage`);
    } catch (error) {
      console.error('Error saving executions to storage:', error);
    }
  }

  static getSettings(): any {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading settings from storage:', error);
      return {};
    }
  }

  static saveSettings(settings: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('Settings saved to storage');
    } catch (error) {
      console.error('Error saving settings to storage:', error);
    }
  }

  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All dashboard data cleared from storage');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  static exportData(): string {
    const data = {
      workflows: this.getWorkflows(),
      executions: this.getExecutions(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.workflows) {
        this.saveWorkflows(data.workflows);
      }
      
      if (data.executions) {
        this.saveExecutions(data.executions);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  static getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    
    // Calculate storage used by our app
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += new Blob([item]).size;
      }
    });
    
    // Rough estimate of localStorage limit (usually 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  }
}
