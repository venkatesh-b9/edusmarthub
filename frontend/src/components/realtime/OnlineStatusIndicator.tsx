import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineUser {
  userId: string;
  userName: string;
  avatar?: string;
  role?: string;
  lastSeen?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

interface OnlineStatusIndicatorProps {
  userIds: string[];
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  maxDisplay?: number;
}

export function OnlineStatusIndicator({
  userIds,
  showTooltip = true,
  size = 'md',
  showBadge = true,
  maxDisplay = 5,
}: OnlineStatusIndicatorProps) {
  const { subscribe, isConnected } = useRealtime();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [userStatuses, setUserStatuses] = useState<Map<string, 'online' | 'away' | 'busy' | 'offline'>>(new Map());

  // Subscribe to online status updates
  useEffect(() => {
    const unsubscribe = subscribe<{ userId: string; status: boolean; userName?: string; avatar?: string; role?: string }>(
      'user:online',
      ({ userId, status, userName, avatar, role }) => {
        if (userIds.includes(userId)) {
          setUserStatuses((prev) => {
            const next = new Map(prev);
            next.set(userId, status ? 'online' : 'offline');
            return next;
          });

          if (status && userName) {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              next.set(userId, {
                userId,
                userName,
                avatar,
                role,
                status: 'online',
                lastSeen: new Date().toISOString(),
              });
              return next;
            });
          } else {
            setOnlineUsers((prev) => {
              const next = new Map(prev);
              const existing = next.get(userId);
              if (existing) {
                next.set(userId, {
                  ...existing,
                  status: 'offline',
                  lastSeen: new Date().toISOString(),
                });
              }
              return next;
            });
          }
        }
      }
    );

    return unsubscribe;
  }, [subscribe, userIds]);

  // Request initial statuses
  useEffect(() => {
    if (isConnected && userIds.length > 0) {
      // Emit request for user statuses
      // This would be handled by your backend
    }
  }, [isConnected, userIds]);

  const sizeMap = {
    sm: { avatar: 'h-6 w-6', indicator: 'h-2 w-2', text: 'text-xs' },
    md: { avatar: 'h-8 w-8', indicator: 'h-2.5 w-2.5', text: 'text-sm' },
    lg: { avatar: 'h-10 w-10', indicator: 'h-3 w-3', text: 'text-base' },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-success border-success';
      case 'away':
        return 'bg-warning border-warning';
      case 'busy':
        return 'bg-destructive border-destructive';
      default:
        return 'bg-muted border-muted';
    }
  };

  const onlineCount = Array.from(userStatuses.values()).filter((s) => s === 'online').length;
  const displayUsers = Array.from(onlineUsers.values())
    .filter((u) => userIds.includes(u.userId))
    .slice(0, maxDisplay);

  if (!isConnected) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Circle className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => {
          const status = userStatuses.get(user.userId) || 'offline';
          return (
            <TooltipProvider key={user.userId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className={cn('border-2 border-background', sizeMap[size].avatar)}>
                      <AvatarFallback className={sizeMap[size].text}>
                        {user.userName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {status === 'online' && (
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 rounded-full border-2 border-background',
                          sizeMap[size].indicator,
                          getStatusColor(status)
                        )}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                {showTooltip && (
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{status}</p>
                      {user.role && <p className="text-xs text-muted-foreground">{user.role}</p>}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {userIds.length > maxDisplay && (
          <div className={cn('rounded-full border-2 border-background bg-muted flex items-center justify-center text-muted-foreground', sizeMap[size].avatar)}>
            <span className={sizeMap[size].text}>+{userIds.length - maxDisplay}</span>
          </div>
        )}
      </div>
      {showBadge && (
        <Badge variant="outline" className="gap-2">
          <Users className="h-3 w-3" />
          <span className="text-xs">{onlineCount}/{userIds.length} online</span>
        </Badge>
      )}
    </div>
  );
}
