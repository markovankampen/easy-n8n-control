
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { WorkflowExecution } from '../pages/Index';
import { TrendingUp, Target, AlertTriangle, Search, Filter, Eye, EyeOff, BarChart3, PieChart, Users, Trophy, Activity, ChevronDown, MessageSquare, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface WorkflowInsightsProps {
  executions: WorkflowExecution[];
}

interface InsightSummary {
  type: 'competitor' | 'influencer' | 'market' | 'performance' | 'general';
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  details: any[];
}

interface MetricCard {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const chartConfig = {
  value: { label: "Value" },
  count: { label: "Count" },
  success: { label: "Success", color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
  competitor: { label: "Competitor Analysis", color: "#ef4444" },
  market: { label: "Market Research", color: "#3b82f6" },
  data: { label: "Data Sync", color: "#f59e0b" },
  notification: { label: "Notifications", color: "#10b981" },
  general: { label: "General", color: "#6b7280" }
};

export const WorkflowInsights: React.FC<WorkflowInsightsProps> = ({ executions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  // Get unique workflows from executions
  const uniqueWorkflows = useMemo(() => {
    const workflowMap = new Map();
    executions.forEach(exec => {
      if (!workflowMap.has(exec.workflowId)) {
        workflowMap.set(exec.workflowId, {
          id: exec.workflowId,
          name: exec.workflowName
        });
      }
    });
    return Array.from(workflowMap.values());
  }, [executions]);

  // Filter executions based on selected workflow
  const filteredExecutions = useMemo(() => {
    if (selectedWorkflow === 'all') return executions;
    return executions.filter(exec => exec.workflowId === selectedWorkflow);
  }, [executions, selectedWorkflow]);

  // Generate metric cards based on real workflow data from database
  const generateMetricCards = (executions: WorkflowExecution[]): MetricCard[] => {
    const cards: MetricCard[] = [];
    
    // Total Executions - count of all executions
    const totalExecutions = executions.length;
    if (totalExecutions > 0) {
      cards.push({
        title: 'Total Executions',
        value: totalExecutions,
        subtitle: 'All workflow runs',
        trend: 'up',
        icon: Activity,
        color: '#3b82f6'
      });
    }

    // Successful Executions - count of successful runs
    const successfulExecutions = executions.filter(exec => exec.status === 'success').length;
    if (successfulExecutions > 0) {
      cards.push({
        title: 'Successful Runs',
        value: successfulExecutions,
        subtitle: 'Completed successfully',
        trend: 'up',
        icon: Trophy,
        color: '#10b981'
      });
    }

    // Failed Executions - count of failed runs
    const failedExecutions = executions.filter(exec => exec.status === 'failed').length;
    if (failedExecutions > 0) {
      cards.push({
        title: 'Failed Runs',
        value: failedExecutions,
        subtitle: 'Execution failures',
        trend: 'down',
        icon: AlertTriangle,
        color: '#ef4444'
      });
    }

    // Average Execution Time - from duration field
    const completedExecutions = executions.filter(exec => exec.duration && exec.duration > 0);
    if (completedExecutions.length > 0) {
      const avgDuration = Math.round(
        completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / completedExecutions.length
      );
      const avgSeconds = (avgDuration / 1000).toFixed(1);
      
      cards.push({
        title: 'Avg Duration',
        value: `${avgSeconds}s`,
        subtitle: `${completedExecutions.length} completed runs`,
        trend: 'stable',
        icon: Clock,
        color: '#f59e0b'
      });
    }

    return cards;
  };

  const generateInsightSummaries = (executions: WorkflowExecution[]): InsightSummary[] => {
    const summaries: InsightSummary[] = [];
    const successfulExecutions = executions.filter(exec => exec.status === 'success' && exec.result);

    // Group executions by type
    const competitorExecutions = successfulExecutions.filter(exec => 
      exec.workflowName.toLowerCase().includes('competitor') || 
      exec.workflowName.toLowerCase().includes('competition')
    );

    const influencerExecutions = successfulExecutions.filter(exec => 
      exec.workflowName.toLowerCase().includes('influencer') || 
      exec.workflowName.toLowerCase().includes('social')
    );

    const marketExecutions = successfulExecutions.filter(exec => 
      exec.workflowName.toLowerCase().includes('market') || 
      exec.workflowName.toLowerCase().includes('research')
    );

    const performanceExecutions = successfulExecutions.filter(exec => 
      exec.workflowName.toLowerCase().includes('performance') || 
      exec.workflowName.toLowerCase().includes('analytics')
    );

    // Generate competitor analysis summary
    if (competitorExecutions.length > 0) {
      const latestExecution = competitorExecutions[0];
      summaries.push({
        type: 'competitor',
        title: 'Competitor Analysis',
        value: `${competitorExecutions.length} analyses completed`,
        change: competitorExecutions.length > 1 ? `+${competitorExecutions.length - 1} new` : undefined,
        trend: 'up',
        lastUpdated: latestExecution.endTime || latestExecution.startTime,
        icon: Target,
        color: '#ef4444',
        details: competitorExecutions.map(exec => ({
          workflow: exec.workflowName,
          timestamp: exec.endTime || exec.startTime,
          result: exec.result
        }))
      });
    }

    // Generate influencer summary
    if (influencerExecutions.length > 0) {
      const latestExecution = influencerExecutions[0];
      summaries.push({
        type: 'influencer',
        title: 'Influencer Insights',
        value: `${influencerExecutions.length} campaigns tracked`,
        change: influencerExecutions.length > 1 ? `+${influencerExecutions.length - 1} new` : undefined,
        trend: 'up',
        lastUpdated: latestExecution.endTime || latestExecution.startTime,
        icon: Users,
        color: '#8b5cf6',
        details: influencerExecutions.map(exec => ({
          workflow: exec.workflowName,
          timestamp: exec.endTime || exec.startTime,
          result: exec.result
        }))
      });
    }

    // Generate market research summary
    if (marketExecutions.length > 0) {
      const latestExecution = marketExecutions[0];
      summaries.push({
        type: 'market',
        title: 'Market Research',
        value: `${marketExecutions.length} reports generated`,
        trend: 'stable',
        lastUpdated: latestExecution.endTime || latestExecution.startTime,
        icon: TrendingUp,
        color: '#3b82f6',
        details: marketExecutions.map(exec => ({
          workflow: exec.workflowName,
          timestamp: exec.endTime || exec.startTime,
          result: exec.result
        }))
      });
    }

    // Generate performance summary
    if (performanceExecutions.length > 0) {
      const latestExecution = performanceExecutions[0];
      summaries.push({
        type: 'performance',
        title: 'Performance Metrics',
        value: `${performanceExecutions.length} metrics updated`,
        trend: 'up',
        lastUpdated: latestExecution.endTime || latestExecution.startTime,
        icon: BarChart3,
        color: '#10b981',
        details: performanceExecutions.map(exec => ({
          workflow: exec.workflowName,
          timestamp: exec.endTime || exec.startTime,
          result: exec.result
        }))
      });
    }

    // General workflow summary
    const generalExecutions = successfulExecutions.filter(exec => 
      !competitorExecutions.includes(exec) && 
      !influencerExecutions.includes(exec) && 
      !marketExecutions.includes(exec) && 
      !performanceExecutions.includes(exec)
    );

    if (generalExecutions.length > 0) {
      const latestExecution = generalExecutions[0];
      summaries.push({
        type: 'general',
        title: 'Other Workflows',
        value: `${generalExecutions.length} executions completed`,
        trend: 'stable',
        lastUpdated: latestExecution.endTime || latestExecution.startTime,
        icon: Activity,
        color: '#6b7280',
        details: generalExecutions.map(exec => ({
          workflow: exec.workflowName,
          timestamp: exec.endTime || exec.startTime,
          result: exec.result
        }))
      });
    }

    return summaries.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  };

  const metricCards = useMemo(() => generateMetricCards(filteredExecutions), [filteredExecutions]);
  const insightSummaries = useMemo(() => generateInsightSummaries(filteredExecutions), [filteredExecutions]);

  const filteredSummaries = insightSummaries.filter(summary => {
    const matchesSearch = summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || summary.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Chart data for workflow distribution
  const getWorkflowDistribution = () => {
    return insightSummaries.map(summary => ({
      name: summary.title,
      value: summary.details.length,
      fill: summary.color
    }));
  };

  // Trend data for the last 7 days
  const getTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayExecutions = filteredExecutions.filter(exec => 
        (exec.endTime || exec.startTime).toDateString() === date.toDateString()
      );
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        total: dayExecutions.length,
        success: dayExecutions.filter(e => e.status === 'success').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length
      };
    }).reverse();

    return last7Days;
  };

  // Get execution statistics for selected workflow
  const getWorkflowStats = () => {
    const totalExecutions = filteredExecutions.length;
    const successfulExecutions = filteredExecutions.filter(exec => exec.status === 'success').length;
    const failedExecutions = filteredExecutions.filter(exec => exec.status === 'failed').length;
    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;
    
    return {
      total: totalExecutions,
      success: successfulExecutions,
      failed: failedExecutions,
      successRate
    };
  };

  const workflowDistribution = getWorkflowDistribution();
  const trendData = getTrendData();
  const workflowStats = getWorkflowStats();

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedWorkflowName = selectedWorkflow === 'all' 
    ? 'All Workflows' 
    : uniqueWorkflows.find(w => w.id === selectedWorkflow)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Metric Cards - Above title */}
      {metricCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                      <p className="text-xs text-gray-500">{card.subtitle}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div 
                        className="p-2 rounded-lg mb-2"
                        style={{ backgroundColor: `${card.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: card.color }} />
                      </div>
                      {getTrendIcon(card.trend)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Insights</h2>
          <p className="text-gray-600">Detailed insights for {selectedWorkflowName}</p>
        </div>
        
        {/* Workflow Selector */}
        <div className="sm:w-64">
          <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
            <SelectTrigger>
              <ChevronDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workflows</SelectItem>
              {uniqueWorkflows.map(workflow => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{workflowStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{workflowStats.success}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{workflowStats.failed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{workflowStats.successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Charts */}
      {workflowDistribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Insight Distribution</span>
              </CardTitle>
              <CardDescription>Breakdown of insight types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={workflowDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {workflowDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Execution Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Execution Trend</span>
              </CardTitle>
              <CardDescription>Daily executions over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="success" stackId="1" fill="#10b981" />
                    <Area type="monotone" dataKey="failed" stackId="1" fill="#ef4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insight Summary Grid */}
      {filteredSummaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map((summary) => {
            const Icon = summary.icon;
            return (
              <Card key={summary.type} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-1 h-full" 
                  style={{ backgroundColor: summary.color }}
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${summary.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: summary.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{summary.title}</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{summary.value}</p>
                      </div>
                    </div>
                    {getTrendIcon(summary.trend)}
                  </div>
                  
                  {summary.change && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {summary.change}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Updated {summary.lastUpdated.toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSummary(
                        expandedSummary === summary.type ? null : summary.type
                      )}
                    >
                      {expandedSummary === summary.type ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Expanded Summary Details */}
      {expandedSummary && (
        <Card>
          <CardHeader>
            <CardTitle>
              {insightSummaries.find(s => s.type === expandedSummary)?.title} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insightSummaries
                .find(s => s.type === expandedSummary)
                ?.details.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{detail.workflow}</h4>
                      <span className="text-sm text-gray-500">
                        {detail.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
                        {typeof detail.result === 'string' 
                          ? detail.result 
                          : JSON.stringify(detail.result, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <SelectItem value="competitor">Competitor Analysis</SelectItem>
                  <SelectItem value="influencer">Influencer Insights</SelectItem>
                  <SelectItem value="market">Market Research</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredSummaries.length === 0 && metricCards.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              {selectedWorkflow === 'all' 
                ? 'Execute some workflows to generate data and insights'
                : `No data available for ${selectedWorkflowName}. Try executing this workflow to generate insights.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
