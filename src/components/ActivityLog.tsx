
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowExecution } from '../pages/Index';
import { CheckCircle, AlertCircle, Loader2, Clock, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ActivityLogProps {
  executions: WorkflowExecution[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ executions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowExecution['status']) => {
    const variants = {
      running: 'secondary',
      success: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const filteredExecutions = executions
    .filter(execution => {
      const matchesSearch = execution.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const getExecutionSummary = () => {
    const total = filteredExecutions.length;
    const running = filteredExecutions.filter(e => e.status === 'running').length;
    const successful = filteredExecutions.filter(e => e.status === 'success').length;
    const failed = filteredExecutions.filter(e => e.status === 'failed').length;

    return { total, running, successful, failed };
  };

  const summary = getExecutionSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Activity Log</h2>
        <p className="text-slate-300">Track all workflow executions and their outcomes</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
            <div className="text-sm text-slate-600">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.running}</div>
            <div className="text-sm text-slate-600">Running</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-slate-600">Successful</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-slate-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-300">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Successful</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution List */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Executions</CardTitle>
          <CardDescription className="text-slate-600">
            {filteredExecutions.length} execution{filteredExecutions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExecutions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Executions Found</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Workflow executions will appear here once you start running workflows'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredExecutions.map((execution) => (
                <Collapsible key={execution.id}>
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium text-slate-900">{execution.workflowName}</div>
                          <div className="text-sm text-slate-600">
                            Started: {execution.startTime.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-slate-900">
                            Duration: {formatDuration(execution.duration)}
                          </div>
                          {execution.endTime && (
                            <div className="text-xs text-slate-600">
                              Ended: {execution.endTime.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {getStatusBadge(execution.status)}
                        
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedExecution(
                              expandedExecution === execution.id ? null : execution.id
                            )}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            {expandedExecution === execution.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Execution Details</h4>
                          <dl className="space-y-1">
                            <div className="flex justify-between">
                              <dt className="text-slate-600">Execution ID:</dt>
                              <dd className="font-mono text-xs text-slate-800">{execution.id}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-600">Workflow ID:</dt>
                              <dd className="font-mono text-xs text-slate-800">{execution.workflowId}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-600">Status:</dt>
                              <dd className="text-slate-800">{execution.status}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-600">Duration:</dt>
                              <dd className="text-slate-800">{formatDuration(execution.duration)}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">
                            {execution.status === 'failed' ? 'Error Details' : 'Result'}
                          </h4>
                          <div className="bg-white p-3 rounded border border-slate-200 max-h-32 overflow-y-auto">
                            {execution.status === 'failed' && execution.error ? (
                              <pre className="text-red-600 text-xs whitespace-pre-wrap">
                                {execution.error}
                              </pre>
                            ) : execution.result ? (
                              <pre className="text-slate-900 text-xs whitespace-pre-wrap">
                                {typeof execution.result === 'string' 
                                  ? execution.result 
                                  : JSON.stringify(execution.result, null, 2)
                                }
                              </pre>
                            ) : (
                              <span className="text-slate-600 text-xs">No additional details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
