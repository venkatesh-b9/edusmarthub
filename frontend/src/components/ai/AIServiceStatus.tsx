/**
 * AI Service Status Component
 * Monitors and displays the status of all AI services
 */

import { useEffect, useState } from 'react';
import { enhancedAIService, AIServiceStatus } from '@/lib/api/services/ai.service.enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIServiceStatusProps {
  refreshInterval?: number;
  showDetails?: boolean;
}

export function AIServiceStatus({
  refreshInterval = 30000,
  showDetails = false,
}: AIServiceStatusProps) {
  const [status, setStatus] = useState<Record<string, AIServiceStatus>>({});
  const [loading, setLoading] = useState(true);

  const checkServices = async () => {
    try {
      setLoading(true);
      const serviceStatus = await enhancedAIService.getAllServiceStatus();
      setStatus(serviceStatus);
    } catch (error) {
      console.error('Failed to check AI service status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServices();

    // Subscribe to real-time status updates
    const unsubscribe = enhancedAIService.subscribeToAlerts((alert) => {
      if (alert.service && alert.status) {
        setStatus((prev) => ({
          ...prev,
          [alert.service]: {
            ...prev[alert.service],
            status: alert.status,
            error: alert.error,
          },
        }));
      }
    });

    // Set up polling interval
    const interval = setInterval(checkServices, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const getStatusIcon = (serviceStatus: AIServiceStatus) => {
    switch (serviceStatus.status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatServiceName = (service: string): string => {
    return service
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && Object.keys(status).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Checking AI service status...</p>
        </CardContent>
      </Card>
    );
  }

  const services = Object.entries(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          AI Service Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No AI services available
            </p>
          ) : (
            services.map(([service, serviceStatus]) => (
              <div
                key={service}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(serviceStatus)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatServiceName(service)}</p>
                    {showDetails && serviceStatus.response_time && (
                      <p className="text-xs text-muted-foreground">
                        Response time: {serviceStatus.response_time}ms
                      </p>
                    )}
                    {showDetails && serviceStatus.error && (
                      <p className="text-xs text-red-600 mt-1">{serviceStatus.error}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn(getStatusColor(serviceStatus.status))}>
                  {serviceStatus.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIServiceStatus;
