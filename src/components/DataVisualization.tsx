
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workflow, WorkflowExecution } from '../types/workflow';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, TrendingUp, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface DataVisualizationProps {
  workflows: Workflow[];
  executions: WorkflowExecution[];
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  workflows,
  executions
}) => {
  const getExecutionStats = () => {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      today: executions.filter(e => e.startTime >= new Date(today.toDateString())).length,
      thisWeek: executions.filter(e => e.startTime >= thisWeek).length,
      thisMonth: executions.filter(e => e.startTime >= thisMonth).length,
      total: executions.length,
      successful: executions.filter(e => e.status === 'success').length,
      failed: executions.filter(e => e.status === 'failed').length
    };
  };

  const getWorkflowChartData = () => {
    return workflows.map(workflow => ({
      name: workflow.name,
      executions: workflow.executionCount,
      successRate: workflow.successRate,
      avgTime: workflow.avgExecutionTime
    }));
  };

  const getExecutionTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayExecutions = executions.filter(e => 
        e.startTime.toDateString() === date.toDateString()
      );
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        executions: dayExecutions.length,
        successful: dayExecutions.filter(e => e.status === 'success').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length
      };
    }).reverse();

    return last7Days;
  };

  const getStatusDistribution = () => {
    const stats = getExecutionStats();
    return [
      { name: 'Successful', value: stats.successful, color: '#10b981' },
      { name: 'Failed', value: stats.failed, color: '#ef4444' },
      { name: 'Running', value: executions.filter(e => e.status === 'running').length, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  };

  const exportData = (type: 'workflows' | 'executions') => {
    const data = type === 'workflows' ? workflows : executions;
    const csv = convertToCSV(data);
    downloadCSV(csv, `${type}-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = getExecutionStats();
  const workflowData = getWorkflowChartData();
  const trendData = getExecutionTrendData();
  const statusData = getStatusDistribution();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Data</h2>
          <p className="text-gray-600">Monitor workflow performance and execution metrics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => exportData('workflows')}>
            <Download className="h-4 w-4 mr-2" />
            Export Workflows
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('executions')}>
            <Download className="h-4 w-4 mr-2" />
            Export Executions
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Performance</CardTitle>
            <CardDescription>Execution counts and success rates by workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workflowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="executions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
            <CardDescription>Distribution of execution outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Execution Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-Day Execution Trend</CardTitle>
            <CardDescription>Daily workflow execution activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="executions" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>Detailed performance metrics for each workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Workflow</th>
                  <th className="text-right py-2">Executions</th>
                  <th className="text-right py-2">Success Rate</th>
                  <th className="text-right py-2">Avg Time</th>
                  <th className="text-right py-2">Last Run</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-gray-500 text-xs">{workflow.description}</div>
                      </div>
                    </td>
                    <td className="text-right py-3">{workflow.executionCount}</td>
                    <td className="text-right py-3">{workflow.successRate}%</td>
                    <td className="text-right py-3">{workflow.avgExecutionTime}ms</td>
                    <td className="text-right py-3">
                      {workflow.lastRun ? workflow.lastRun.toLocaleString() : 'Never'}
                    </td>
                    <td className="text-center py-3">
                      <Badge variant={
                        workflow.status === 'success' ? 'default' :
                        workflow.status === 'failed' ? 'destructive' :
                        workflow.status === 'running' ? 'secondary' : 'outline'
                      }>
                        {workflow.status}
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
