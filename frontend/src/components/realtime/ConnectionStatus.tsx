import { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { socketManager } from '@/lib/socket';
import { toast } from 'sonner';

interface ConnectionStatusProps {
  showDetailed?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
}

export function ConnectionStatus({
  showDetailed = false,
  position = 'top-right',
  autoHide = true,
}: ConnectionStatusProps) {
  const { isConnected, connectionStatus } = useRealtime();
  const [showAlert, setShowAlert] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!isConnected && connectionStatus === 'error') {
      setShowAlert(true);
    } else if (isConnected && autoHide) {
      // Hide after a delay when connected
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionStatus, autoHide]);

  const handleReconnect = () => {
    socketManager.disconnect();
    setTimeout(() => {
      socketManager.connect();
      toast.info('Attempting to reconnect...');
    }, 1000);
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (showDetailed && showAlert && !isConnected) {
    return (
      <Alert
        className={cn(
          'fixed z-50 max-w-md shadow-lg',
          positionClasses[position],
          connectionStatus === 'connected' ? 'border-success' : 'border-destructive'
        )}
      >
        <div className="flex items-start gap-3">
          {connectionStatus === 'connected' ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          <div className="flex-1">
            <AlertTitle>
              {connectionStatus === 'connected' ? 'Connected' : 'Connection Lost'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {connectionStatus === 'connected' ? (
                'Real-time features are active'
              ) : (
                <div className="space-y-2">
                  <p>Unable to connect to real-time services. Some features may be unavailable.</p>
                  <Button size="sm" onClick={handleReconnect} className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              )}
            </AlertDescription>
          </div>
          {autoHide && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAlert(false)}
            >
              ×
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (!showDetailed) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-2',
          isConnected
            ? 'text-success border-success'
            : 'text-destructive border-destructive'
        )}
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Disconnected</span>
          </>
        )}
      </Badge>
    );
  }

  return null;
}
