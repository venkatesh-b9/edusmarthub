import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { markAsRead, markAllAsRead, removeNotification, setNotifications } from '@/store/slices/notificationSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BellRing, CheckCheck, X, Filter, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface LiveNotificationsProps {
  showUnreadOnly?: boolean;
  maxHeight?: string;
}

export function LiveNotifications({ showUnreadOnly = false, maxHeight = '600px' }: LiveNotificationsProps) {
  const { subscribe, isConnected } = useRealtime();
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribe = subscribe<any>('notification:new', (notification) => {
      // Notification is already added to store by socket manager
      // Optionally show toast based on priority
      if (notification.priority === 'high') {
        toast.error(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Load persisted notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/notifications');
        if (response.data) {
          dispatch(setNotifications(response.data));
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [dispatch]);

  // Persist read status
  const handleMarkAsRead = async (id: string) => {
    dispatch(markAsRead(id));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    dispatch(markAllAsRead());
    try {
      await api.post('/notifications/read-all');
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleRemoveNotification = async (id: string) => {
    dispatch(removeNotification(id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'medium':
        return 'bg-warning/10 border-warning/20 text-warning';
      default:
        return 'bg-info/10 border-info/20 text-info';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (showUnreadOnly && n.read) return false;
    if (filter === 'all') return true;
    return n.priority === filter;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    // Sort by priority then timestamp
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <BellRing className="h-5 w-5 text-success" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Notifications</CardTitle>
              {!isConnected && (
                <p className="text-xs text-muted-foreground mt-1">Reconnecting...</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="high">
              High
              <Badge variant="destructive" className="ml-2">
                {notifications.filter((n) => n.priority === 'high' && !n.read).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="medium">
              Medium
              <Badge variant="outline" className="ml-2 border-warning text-warning">
                {notifications.filter((n) => n.priority === 'medium' && !n.read).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="mt-4" style={{ maxHeight }}>
            <div className="space-y-2">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50',
                    !notification.read && 'bg-primary/5 border-primary/20',
                    notification.read && 'bg-muted/30 border-border/50'
                  )}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-full', getPriorityColor(notification.priority))}>
                      {getPriorityIcon(notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {notification.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              {notification.priority}
                            </Badge>
                          )}
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</p>
                        <div className="flex items-center gap-2">
                          {notification.read ? (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNotification(notification.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {notification.link && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2 h-auto p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.link!;
                          }}
                        >
                          View Details →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
