
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { WorkflowExecution } from '../pages/Index';
import { TrendingUp, Target, AlertTriangle, Search, Filter, Eye, EyeOff, BarChart3, PieChart, Users, Trophy, Activity } from 'lucide-react';
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
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

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

  const insightSummaries = useMemo(() => generateInsightSummaries(executions), [executions]);

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
      const dayExecutions = executions.filter(exec => 
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

  const workflowDistribution = getWorkflowDistribution();
  const trendData = getTrendData();

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Insights Summary</h2>
        <p className="text-gray-600">Comprehensive overview of all workflow executions and their insights</p>
      </div>

      {/* Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Workflow Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of workflow types executed</CardDescription>
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
            <CardDescription>Daily workflow executions over the last 7 days</CardDescription>
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

      {/* Insight Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightSummaries.map((summary) => {
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
                      <Icon className="h-6 w-6" color={summary.color} />
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

      {filteredSummaries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
            <p className="text-gray-500">
              Execute some workflows to generate insights and summaries
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
