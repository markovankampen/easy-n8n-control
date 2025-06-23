
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Workflow } from '../types/workflow';
import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';

interface StatusDisplayProps {
  workflows: Workflow[];
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ workflows }) => {
  const getOverallStatus = () => {
    const runningCount = workflows.filter(w => w.status === 'running').length;
    const failedCount = workflows.filter(w => w.status === 'failed').length;
    
    if (runningCount > 0) return 'running';
    if (failedCount > 0) return 'warning';
    return 'healthy';
  };

  const getStatusCounts = () => {
    return {
      total: workflows.length,
      running: workflows.filter(w => w.status === 'running').length,
      success: workflows.filter(w => w.status === 'success').length,
      failed: workflows.filter(w => w.status === 'failed').length,
      idle: workflows.filter(w => w.status === 'idle').length
    };
  };

  const overallStatus = getOverallStatus();
  const counts = getStatusCounts();

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-red-100 text-red-800';
      case 'healthy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'running':
        return `${counts.running} Running`;
      case 'warning':
        return `${counts.failed} Failed`;
      case 'healthy':
        return 'All Healthy';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Badge variant="outline" className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </Badge>
      
      <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
        <span>{counts.total} workflows</span>
        {counts.running > 0 && (
          <span className="text-blue-600">• {counts.running} running</span>
        )}
        {counts.failed > 0 && (
          <span className="text-red-600">• {counts.failed} failed</span>
        )}
      </div>
    </div>
  );
};
