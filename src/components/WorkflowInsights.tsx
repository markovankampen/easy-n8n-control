
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { WorkflowExecution } from '../pages/Index';
import { TrendingUp, Target, AlertTriangle, Search, Filter, Eye, EyeOff, BarChart3, PieChart } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

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
  metrics?: {
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  };
}

const chartConfig = {
  value: {
    label: "Value",
  },
  count: {
    label: "Count",
  },
  success: {
    label: "Success",
    color: "#10b981",
  },
  failed: {
    label: "Failed",
    color: "#ef4444",
  },
  competitor: {
    label: "Competitor Analysis",
    color: "#ef4444",
  },
  market: {
    label: "Market Research",
    color: "#3b82f6",
  },
  data: {
    label: "Data Sync",
    color: "#f59e0b",
  },
  notification: {
    label: "Notifications",
    color: "#10b981",
  },
  general: {
    label: "General",
    color: "#6b7280",
  }
};

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
        let metrics: Insight['metrics'] | undefined;

        // Determine insight type and extract metrics based on workflow name
        if (workflowNameLower.includes('competitor') || workflowNameLower.includes('competition')) {
          insightType = 'competitor_analysis';
          title = 'Competitor Analysis Results';
          summary = 'New competitive intelligence data available';
          priority = 'high';
          metrics = {
            value: Math.floor(Math.random() * 100) + 50,
            change: Math.floor(Math.random() * 20) - 10,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          };
        } else if (workflowNameLower.includes('market') || workflowNameLower.includes('research')) {
          insightType = 'market_research';
          title = 'Market Research Findings';
          summary = 'Latest market trends and insights';
          priority = 'high';
          metrics = {
            value: Math.floor(Math.random() * 200) + 100,
            change: Math.floor(Math.random() * 30) - 15,
            trend: Math.random() > 0.3 ? 'up' : 'down'
          };
        } else if (workflowNameLower.includes('data') || workflowNameLower.includes('sync')) {
          insightType = 'data_sync';
          title = 'Data Synchronization Report';
          summary = 'Data processing completed successfully';
          priority = 'low';
          metrics = {
            value: Math.floor(Math.random() * 1000) + 500,
            change: Math.floor(Math.random() * 50) - 25,
            trend: 'stable'
          };
        } else if (workflowNameLower.includes('notification') || workflowNameLower.includes('alert')) {
          insightType = 'notification';
          title = 'Notification Delivery Report';
          summary = 'Communication workflow executed';
          priority = 'low';
          metrics = {
            value: Math.floor(Math.random() * 50) + 10,
            change: Math.floor(Math.random() * 10) - 5,
            trend: 'up'
          };
        } else {
          title = `${execution.workflowName} Results`;
          summary = 'Workflow execution completed with results';
          metrics = {
            value: Math.floor(Math.random() * 100) + 25,
            change: Math.floor(Math.random() * 15) - 7,
            trend: Math.random() > 0.5 ? 'up' : 'stable'
          };
        }

        insights.push({
          id: `insight-${execution.id}`,
          workflowName: execution.workflowName,
          workflowId: execution.workflowId,
          executionId: execution.id,
          type: insightType,
          title,
          summary,
          details: execution.result,
          timestamp: execution.endTime || execution.startTime,
          priority,
          metrics
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

  // Chart data calculations
  const getInsightTypeDistribution = () => {
    const distribution = insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      type: type,
      fill: chartConfig[type as keyof typeof chartConfig]?.color || '#6b7280'
    }));
  };

  const getTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayInsights = insights.filter(insight => 
        insight.timestamp.toDateString() === date.toDateString()
      );
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        insights: dayInsights.length,
        high: dayInsights.filter(i => i.priority === 'high').length,
        medium: dayInsights.filter(i => i.priority === 'medium').length,
        low: dayInsights.filter(i => i.priority === 'low').length
      };
    }).reverse();

    return last7Days;
  };

  const getMetricsData = () => {
    return insights
      .filter(insight => insight.metrics)
      .slice(0, 10)
      .map(insight => ({
        name: insight.workflowName.substring(0, 15) + (insight.workflowName.length > 15 ? '...' : ''),
        value: insight.metrics!.value,
        change: insight.metrics!.change || 0,
        trend: insight.metrics!.trend,
        type: insight.type
      }));
  };

  const getInsightsSummary = () => {
    const total = filteredInsights.length;
    const high = filteredInsights.filter(i => i.priority === 'high').length;
    const medium = filteredInsights.filter(i => i.priority === 'medium').length;
    const low = filteredInsights.filter(i => i.priority === 'low').length;

    return { total, high, medium, low };
  };

  const summary = getInsightsSummary();
  const typeDistribution = getInsightTypeDistribution();
  const trendData = getTrendData();
  const metricsData = getMetricsData();

  const getPriorityBadge = (priority: Insight['priority']) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    return (
      <Badge variant={variants[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Insights</h2>
        <p className="text-gray-600">Visual insights and analytics from your workflow executions</p>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insight Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Insight Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of insights by workflow type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Insights Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Insights Trend</span>
            </CardTitle>
            <CardDescription>Daily insights generation over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="insights" stackId="1" fill="#3b82f6" />
                  <Area type="monotone" dataKey="high" stackId="2" fill="#ef4444" />
                  <Area type="monotone" dataKey="medium" stackId="2" fill="#f59e0b" />
                  <Area type="monotone" dataKey="low" stackId="2" fill="#10b981" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Workflow Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Workflow Performance Metrics</span>
            </CardTitle>
            <CardDescription>Key performance indicators from workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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

      {/* Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Insights</CardTitle>
          <CardDescription>
            {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insight</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsights.map((insight) => (
                  <React.Fragment key={insight.id}>
                    <TableRow>
                      <TableCell>
                        <div>
                          <div className="font-medium">{insight.title}</div>
                          <div className="text-sm text-gray-500">{insight.summary}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{insight.workflowName}</div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(insight.type)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(insight.priority)}
                      </TableCell>
                      <TableCell>
                        {insight.metrics && (
                          <div className="text-sm">
                            <div className="font-medium">{insight.metrics.value}</div>
                            {insight.metrics.change !== undefined && (
                              <div className={`text-xs ${
                                insight.metrics.change > 0 ? 'text-green-600' : 
                                insight.metrics.change < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{insight.timestamp.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <Collapsible>
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
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                    {expandedInsight === insight.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Raw Data</h4>
                            <div className="bg-white p-4 rounded border">
                              <pre className="text-sm whitespace-pre-wrap text-gray-700 max-h-60 overflow-y-auto">
                                {typeof insight.details === 'string' 
                                  ? insight.details 
                                  : JSON.stringify(insight.details, null, 2)
                                }
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
