/**
 * Production Monitoring Dashboard
 * Real-time monitoring of all system components
 */

import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api/apiService';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';
import { IntegrationManager } from '@/core/IntegrationManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LiveDataDashboard, { Metric } from '@/components/realtime/LiveDataDashboard';
import AIServiceStatus from '@/components/ai/AIServiceStatus';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: string;
    responseTime?: number;
    lastCheck?: string;
  }>;
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
    load: number[];
  };
}

interface AIPerformanceMetrics {
  services: Record<string, {
    requests: number;
    avgResponseTime: number;
    errorRate: number;
    successRate: number;
  }>;
  predictions: {
    total: number;
    accuracy: number;
    avgConfidence: number;
  };
}

interface UserActivity {
  activeUsers: number;
  requestsPerMinute: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    avgResponseTime: number;
  }>;
}

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  action?: {
    type: string;
    endpoint: string;
    data: any;
  };
  priority: 'low' | 'medium' | 'high';
}

export default function ProductionMonitor() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [aiPerformance, setAIPerformance] = useState<AIPerformanceMetrics | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize integration manager
    const initManager = async () => {
      try {
        await IntegrationManager.getInstance().initializeServices();
      } catch (error) {
        console.error('Failed to initialize integration manager:', error);
      }
    };
    initManager();

    // Real-time monitoring
    const healthInterval = setInterval(async () => {
      try {
        const health = await apiService.get<SystemHealth>('/monitoring/health');
        setSystemHealth(health);
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      }
    }, 5000);

    const aiInterval = setInterval(async () => {
      try {
        const performance = await apiService.get<AIPerformanceMetrics>('/monitoring/ai/performance');
        setAIPerformance(performance);
      } catch (error) {
        console.error('Failed to fetch AI performance:', error);
      }
    }, 10000);

    const activityInterval = setInterval(async () => {
      try {
        const activity = await apiService.get<UserActivity>('/monitoring/activity');
        setUserActivity(activity);
      } catch (error) {
        console.error('Failed to fetch user activity:', error);
      }
    }, 15000);

    // Subscribe to real-time events
    const unsubscribe = apiService.subscribe('monitoring.*', (event: any) => {
      if (event.type === 'anomaly_detected') {
        setAlerts((prev) => [{ ...event.data, timestamp: Date.now() }, ...prev.slice(0, 9)]);
        showAnomalyAlert(event.data);
      }
    });

    // Get AI insights
    const fetchInsights = async () => {
      try {
        const insights = await enhancedAIService.processNLQ(
          'Analyze system performance and provide optimization insights',
          {
            type: 'system_analysis',
            systemHealth,
            aiPerformance,
            userActivity,
          }
        );

        setAIInsights(Array.isArray(insights) ? insights : [insights]);
      } catch (error) {
        console.error('Failed to fetch AI insights:', error);
      }
    };
    fetchInsights();
    const insightsInterval = setInterval(fetchInsights, 60000);

    setLoading(false);

    return () => {
      clearInterval(healthInterval);
      clearInterval(aiInterval);
      clearInterval(activityInterval);
      clearInterval(insightsInterval);
      unsubscribe();
    };
  }, []);

  const applyAIOptimization = async (insight: AIInsight) => {
    try {
      await apiService.post('/system/optimize', {
        insight,
        autoApply: insight.confidence > 0.9,
      });

      toast.success('Optimization applied', {
        description: insight.title,
      });
    } catch (error: any) {
      toast.error('Failed to apply optimization', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const showAnomalyAlert = (data: any) => {
    toast.error('Anomaly Detected', {
      description: data.message || 'System anomaly detected',
      duration: 5000,
    });
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  const metrics: Metric[] = [
    {
      key: 'active_users',
      title: 'Active Users',
      format: 'number',
    },
    {
      key: 'requests_per_minute',
      title: 'Requests/min',
      format: 'number',
    },
    {
      key: 'avg_response_time',
      title: 'Avg Response',
      format: 'duration',
    },
    {
      key: 'error_rate',
      title: 'Error Rate',
      format: 'percentage',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of all system components
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-lg px-4 py-2',
            systemHealth && getHealthColor(systemHealth.status)
          )}
        >
          {systemHealth?.status || 'Unknown'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <LiveDataDashboard metrics={metrics} />

          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTitle>{alert.title || 'Alert'}</AlertTitle>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <AIServiceStatus refreshInterval={30000} showDetails={true} />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {systemHealth && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Memory Usage</p>
                      <p className="text-2xl font-bold">
                        {systemHealth.system.memory.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {systemHealth.system.memory.used}MB / {systemHealth.system.memory.total}MB
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(systemHealth.system.uptime / 3600)}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(systemHealth.services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{service}</span>
                        <div className="flex items-center gap-2">
                          {status.responseTime && (
                            <span className="text-xs text-muted-foreground">
                              {status.responseTime}ms
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              status.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                            )}
                          >
                            {status.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          {aiPerformance && (
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(aiPerformance.services).map(([service, metrics]) => (
                    <div key={service} className="p-4 border rounded">
                      <h3 className="font-medium mb-2">{service}</h3>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Requests</p>
                          <p className="font-bold">{metrics.requests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Response</p>
                          <p className="font-bold">{metrics.avgResponseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Error Rate</p>
                          <p className="font-bold text-red-600">{metrics.errorRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-bold text-green-600">{metrics.successRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {userActivity && (
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">{userActivity.activeUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requests/min</p>
                      <p className="text-2xl font-bold">{userActivity.requestsPerMinute}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Top Endpoints</p>
                    <div className="space-y-2">
                      {userActivity.topEndpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{endpoint.endpoint}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              {endpoint.count} requests
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {endpoint.avgResponseTime}ms avg
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Optimization Insights
              </CardTitle>
              <CardDescription>
                AI-powered recommendations for system optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className="p-4 border rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            insight.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                          )}
                        >
                          {insight.priority} priority
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {(insight.confidence * 100).toFixed(1)}%
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyAIOptimization(insight)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No insights available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
