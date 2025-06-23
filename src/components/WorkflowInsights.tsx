
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowExecution } from '../pages/Index';
import { TrendingUp, Target, AlertTriangle, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface WorkflowInsightsProps {
  executions: WorkflowExecution[];
}

interface Insight {
  id: string;
  workflowName: string;
  workflowId: string;
  executionId: string;
  type: 'competitor_analysis' | 'market_research' | 'data_sync' | 'notification' | 'general';
  title: string;
  summary: string;
  details: any;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export const WorkflowInsights: React.FC<WorkflowInsightsProps> = ({ executions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const extractInsights = (executions: WorkflowExecution[]): Insight[] => {
    const insights: Insight[] = [];

    executions
      .filter(exec => exec.status === 'success' && exec.result)
      .forEach(execution => {
        const workflowNameLower = execution.workflowName.toLowerCase();
        let insightType: Insight['type'] = 'general';
        let title = '';
        let summary = '';
        let priority: Insight['priority'] = 'medium';

        // Determine insight type based on workflow name
        if (workflowNameLower.includes('competitor') || workflowNameLower.includes('competition')) {
          insightType = 'competitor_analysis';
          title = 'Competitor Analysis Results';
          summary = 'New competitive intelligence data available';
          priority = 'high';
        } else if (workflowNameLower.includes('market') || workflowNameLower.includes('research')) {
          insightType = 'market_research';
          title = 'Market Research Findings';
          summary = 'Latest market trends and insights';
          priority = 'high';
        } else if (workflowNameLower.includes('data') || workflowNameLower.includes('sync')) {
          insightType = 'data_sync';
          title = 'Data Synchronization Report';
          summary = 'Data processing completed successfully';
          priority = 'low';
        } else if (workflowNameLower.includes('notification') || workflowNameLower.includes('alert')) {
          insightType = 'notification';
          title = 'Notification Delivery Report';
          summary = 'Communication workflow executed';
          priority = 'low';
        } else {
          title = `${execution.workflowName} Results`;
          summary = 'Workflow execution completed with results';
        }

        // Try to extract meaningful data from results
        let processedResult = execution.result;
        if (typeof execution.result === 'string') {
          try {
            processedResult = JSON.parse(execution.result);
          } catch {
            processedResult = execution.result;
          }
        }

        insights.push({
          id: `insight-${execution.id}`,
          workflowName: execution.workflowName,
          workflowId: execution.workflowId,
          executionId: execution.id,
          type: insightType,
          title,
          summary,
          details: processedResult,
          timestamp: execution.endTime || execution.startTime,
          priority
        });
      });

    return insights.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const insights = useMemo(() => extractInsights(executions), [executions]);

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || insight.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'competitor_analysis':
        return <Target className="h-5 w-5 text-red-500" />;
      case 'market_research':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'data_sync':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'notification':
        return <AlertTriangle className="h-5 w-5 text-green-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: Insight['priority']) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const colors = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    };

    return (
      <Badge variant={variants[priority]}>
        {colors[priority]}
      </Badge>
    );
  };

  const getTypeBadge = (type: Insight['type']) => {
    const typeLabels = {
      competitor_analysis: 'Competitor Analysis',
      market_research: 'Market Research',
      data_sync: 'Data Sync',
      notification: 'Notification',
      general: 'General'
    };

    return (
      <Badge variant="outline" className="capitalize">
        {typeLabels[type]}
      </Badge>
    );
  };

  const renderInsightDetails = (insight: Insight) => {
    if (typeof insight.details === 'string') {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap text-gray-700">{insight.details}</pre>
        </div>
      );
    }

    if (typeof insight.details === 'object' && insight.details !== null) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap text-gray-700">
            {JSON.stringify(insight.details, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <span className="text-gray-500 text-sm">No detailed data available</span>
      </div>
    );
  };

  const getInsightsSummary = () => {
    const total = filteredInsights.length;
    const high = filteredInsights.filter(i => i.priority === 'high').length;
    const medium = filteredInsights.filter(i => i.priority === 'medium').length;
    const low = filteredInsights.filter(i => i.priority === 'low').length;

    return { total, high, medium, low };
  };

  const summary = getInsightsSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Insights</h2>
        <p className="text-gray-600">Extracted insights and findings from successful workflow executions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">Total Insights</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.high}</div>
            <div className="text-sm text-gray-500">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.medium}</div>
            <div className="text-sm text-gray-500">Medium Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.low}</div>
            <div className="text-sm text-gray-500">Low Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="competitor_analysis">Competitor Analysis</SelectItem>
                  <SelectItem value="market_research">Market Research</SelectItem>
                  <SelectItem value="data_sync">Data Sync</SelectItem>
                  <SelectItem value="notification">Notifications</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>
            {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Insights will appear here as workflows complete successfully with meaningful results'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredInsights.map((insight) => (
                <Collapsible key={insight.id}>
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{insight.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{insight.summary}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">From: {insight.workflowName}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {insight.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end space-y-2">
                          {getPriorityBadge(insight.priority)}
                          {getTypeBadge(insight.type)}
                        </div>
                        
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedInsight(
                              expandedInsight === insight.id ? null : insight.id
                            )}
                          >
                            {expandedInsight === insight.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Detailed Results</h4>
                          {renderInsightDetails(insight)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Execution Info</h5>
                            <dl className="space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Workflow:</dt>
                                <dd className="font-mono text-xs">{insight.workflowName}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Execution ID:</dt>
                                <dd className="font-mono text-xs">{insight.executionId}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Type:</dt>
                                <dd className="capitalize">{insight.type.replace('_', ' ')}</dd>
                              </div>
                            </dl>
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
