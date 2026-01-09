/**
 * Live Data Dashboard Component
 * Displays real-time metrics with WebSocket updates
 */

import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Metric {
  key: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  unit?: string;
}

export interface LiveMetricData {
  value: number;
  trend?: 'up' | 'down' | 'stable';
  updatedAt: Date;
  previousValue?: number;
}

interface LiveMetricCardProps {
  metric: Metric;
  data: LiveMetricData | null;
}

function LiveMetricCard({ metric, data }: LiveMetricCardProps) {
  const Icon = metric.icon || Activity;

  const formatValue = (value: number): string => {
    switch (metric.format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'duration':
        return `${Math.floor(value / 60)}m ${value % 60}s`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!data?.trend) return null;

    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data ? formatValue(data.value) : '--'}
          {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {data && (
            <>
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">
                {data.previousValue !== undefined &&
                  `${data.trend === 'up' ? '+' : ''}${((data.value - data.previousValue) / data.previousValue * 100).toFixed(1)}%`}
              </span>
              <Badge variant="outline" className="ml-auto text-xs">
                {formatTime(data.updatedAt)}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LiveDataDashboardProps {
  metrics: Metric[];
  updateInterval?: number;
}

export function LiveDataDashboard({ metrics, updateInterval = 5000 }: LiveDataDashboardProps) {
  const [liveData, setLiveData] = useState<Record<string, LiveMetricData>>({});

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      for (const metric of metrics) {
        try {
          const response = await apiService.get<{ value: number; trend?: string; previous_value?: number }>(
            `/metrics/${metric.key}`
          );

          setLiveData((prev) => ({
            ...prev,
            [metric.key]: {
              value: response.value || 0,
              trend: response.trend as 'up' | 'down' | 'stable',
              updatedAt: new Date(),
              previousValue: response.previous_value,
            },
          }));
        } catch (error) {
          console.error(`Failed to fetch metric ${metric.key}:`, error);
        }
      }
    };

    fetchInitialData();
  }, [metrics]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscriptions = metrics.map((metric) => {
      const channel = `metrics.${metric.key}`;
      return apiService.subscribe(channel, (data: any) => {
        setLiveData((prev) => ({
          ...prev,
          [metric.key]: {
            value: data.value || prev[metric.key]?.value || 0,
            trend: data.trend || prev[metric.key]?.trend || 'stable',
            updatedAt: new Date(),
            previousValue: prev[metric.key]?.value,
          },
        }));
      });
    });

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [metrics]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <LiveMetricCard key={metric.key} metric={metric} data={liveData[metric.key] || null} />
      ))}
    </div>
  );
}

export default LiveDataDashboard;
