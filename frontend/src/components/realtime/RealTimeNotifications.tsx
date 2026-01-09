/**
 * Real-Time Notifications Component
 * Displays real-time notifications with WebSocket integration
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/lib/api/apiService';
import { socketManager } from '@/lib/socket';
import { toast } from 'sonner';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  action?: {
    type: 'route' | 'api';
    path?: string;
    endpoint?: string;
    method?: string;
  };
  metadata?: Record<string, any>;
}

interface RealTimeNotificationsProps {
  maxNotifications?: number;
  showUnreadBadge?: boolean;
  autoMarkRead?: boolean;
  autoMarkReadDelay?: number;
}

export function RealTimeNotifications({
  maxNotifications = 50,
  showUnreadBadge = true,
  autoMarkRead = false,
  autoMarkReadDelay = 5000,
}: RealTimeNotificationsProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiService.get<{
        data: Notification[];
        unread_count: number;
      }>('/notifications');

      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiService.post(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.post('/notifications/read-all');

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Handle notification action
  const handleNotificationAction = useCallback(
    (notification: Notification) => {
      if (notification.action) {
        if (notification.action.type === 'route' && notification.action.path) {
          navigate(notification.action.path);
        } else if (
          notification.action.type === 'api' &&
          notification.action.endpoint
        ) {
          const method = (notification.action.method || 'POST').toLowerCase() as
            | 'get'
            | 'post'
            | 'put'
            | 'delete';
          apiService[method](notification.action.endpoint);
        }
      }

      if (!notification.read) {
        markAsRead(notification.id);
      }
    },
    [navigate, markAsRead]
  );

  // Show toast notification
  const showToastNotification = useCallback((notification: Notification) => {
    const toastOptions = {
      description: notification.message,
      duration: notification.priority === 'high' ? 5000 : 3000,
    };

    if (notification.priority === 'high') {
      toast.error(notification.title, toastOptions);
    } else if (notification.priority === 'medium') {
      toast.warning(notification.title, toastOptions);
    } else {
      toast.info(notification.title, toastOptions);
    }
  }, []);

  // WebSocket subscription
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = apiService.subscribe('notifications', (data: any) => {
      const newNotification: Notification = {
        id: data.id || `notification-${Date.now()}-${Math.random()}`,
        type: data.type || 'info',
        title: data.title || 'New Notification',
        message: data.message || '',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        read: false,
        priority: data.priority || 'low',
        action: data.action,
        metadata: data.metadata,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      setUnreadCount((prev) => prev + 1);

      // Show toast
      showToastNotification(newNotification);

      // Auto-mark as read if enabled
      if (autoMarkRead) {
        setTimeout(() => {
          markAsRead(newNotification.id);
        }, autoMarkReadDelay);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [maxNotifications, autoMarkRead, autoMarkReadDelay, fetchNotifications, showToastNotification, markAsRead]);

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Get priority color
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {showUnreadBadge && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start p-3 cursor-pointer',
                  !notification.read && 'bg-muted/50'
                )}
                onClick={() => handleNotificationAction(notification)}
              >
                <div className="flex items-start w-full gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      !notification.read && getPriorityColor(notification.priority)
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RealTimeNotifications;
