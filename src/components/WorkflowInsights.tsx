
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowExecution } from '../pages/Index';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Target, Zap } from 'lucide-react';

interface WorkflowInsightsProps {
  executions: WorkflowExecution[];
}

export const WorkflowInsights: React.FC<WorkflowInsightsProps> = ({ executions }) => {
  const getPerformanceMetrics = () => {
    if (executions.length === 0) return null;

    const completedExecutions = executions.filter(e => e.duration);
    const durations = completedExecutions.map(e => e.duration!);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentExecutions = executions.filter(e => e.startTime >= last24Hours);
    
    const successRate = executions.length > 0 
      ? (executions.filter(e => e.status === 'success').length / executions.length) * 100 
      : 0;

    return {
      totalExecutions: executions.length,
      avgDuration: Math.round(avgDuration),
      successRate: Math.round(successRate),
      recentExecutions: recentExecutions.length,
      failureRate: Math.round(100 - successRate)
    };
  };

  const getWorkflowPerformance = () => {
    const workflowStats = new Map();
    
    executions.forEach(execution => {
      const workflowName = execution.workflowName;
      if (!workflowStats.has(workflowName)) {
        workflowStats.set(workflowName, {
          name: workflowName,
          executions: 0,
          successes: 0,
          failures: 0,
          totalDuration: 0,
          completedExecutions: 0
        });
      }
      
      const stats = workflowStats.get(workflowName);
      stats.executions++;
      
      if (execution.status === 'success') stats.successes++;
      if (execution.status === 'failed') stats.failures++;
      if (execution.duration) {
        stats.totalDuration += execution.duration;
        stats.completedExecutions++;
      }
    });

    return Array.from(workflowStats.values()).map(stats => ({
      ...stats,
      successRate: stats.executions > 0 ? Math.round((stats.successes / stats.executions) * 100) : 0,
      avgDuration: stats.completedExecutions > 0 ? Math.round(stats.totalDuration / stats.completedExecutions) : 0
    })).sort((a, b) => b.executions - a.executions);
  };

  const getRecommendations = () => {
    const metrics = getPerformanceMetrics();
    const workflowPerf = getWorkflowPerformance();
    const recommendations = [];

    if (metrics) {
      if (metrics.successRate < 80) {
        recommendations.push({
          type: 'warning',
          title: 'Low Success Rate',
          description: `Current success rate is ${metrics.successRate}%. Consider reviewing failed workflows.`,
          icon: AlertTriangle
        });
      }

      if (metrics.avgDuration > 30000) {
        recommendations.push({
          type: 'info',
          title: 'Performance Optimization',
          description: `Average execution time is ${Math.round(metrics.avgDuration / 1000)}s. Consider optimizing slow workflows.`,
          icon: Clock
        });
      }

      const slowWorkflows = workflowPerf.filter(w => w.avgDuration > 60000);
      if (slowWorkflows.length > 0) {
        recommendations.push({
          type: 'info',
          title: 'Slow Workflows Detected',
          description: `${slowWorkflows.length} workflow(s) taking over 1 minute to complete.`,
          icon: TrendingDown
        });
      }

      if (metrics.successRate > 95) {
        recommendations.push({
          type: 'success',
          title: 'Excellent Performance',
          description: 'Your workflows are performing exceptionally well!',
          icon: Target
        });
      }
    }

    return recommendations;
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const metrics = getPerformanceMetrics();
  const workflowPerformance = getWorkflowPerformance();
  const recommendations = getRecommendations();

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Workflow Insights</h2>
          <p className="text-slate-300">AI-powered analysis and recommendations</p>
        </div>
        
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Data Available</h3>
            <p className="text-slate-600">
              Start running workflows to see AI-powered insights and recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Workflow Insights</h2>
        <p className="text-slate-300">AI-powered analysis and recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Duration</p>
                <p className="text-2xl font-bold text-slate-900">{formatDuration(metrics.avgDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">24h Activity</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.recentExecutions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Runs</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalExecutions}</p>
              </div>
              <Zap className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">AI Recommendations</CardTitle>
            <CardDescription className="text-slate-600">Insights to improve your workflow performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Icon className={`h-5 w-5 mt-0.5 ${
                      rec.type === 'warning' ? 'text-yellow-500' :
                      rec.type === 'success' ? 'text-green-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <h4 className="font-medium text-slate-900">{rec.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Performance Table */}
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Workflow Performance Analysis</CardTitle>
          <CardDescription className="text-slate-600">Detailed breakdown by workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-slate-900 font-semibold">Workflow</th>
                  <th className="text-right py-3 text-slate-900 font-semibold">Executions</th>
                  <th className="text-right py-3 text-slate-900 font-semibold">Success Rate</th>
                  <th className="text-right py-3 text-slate-900 font-semibold">Avg Duration</th>
                  <th className="text-center py-3 text-slate-900 font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {workflowPerformance.map((workflow, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{workflow.name}</div>
                    </td>
                    <td className="text-right py-3 text-slate-700">{workflow.executions}</td>
                    <td className="text-right py-3 text-slate-700">{workflow.successRate}%</td>
                    <td className="text-right py-3 text-slate-700">{formatDuration(workflow.avgDuration)}</td>
                    <td className="text-center py-3">
                      <Badge variant={
                        workflow.successRate >= 95 ? 'default' :
                        workflow.successRate >= 80 ? 'secondary' : 'destructive'
                      }>
                        {workflow.successRate >= 95 ? 'Excellent' :
                         workflow.successRate >= 80 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
