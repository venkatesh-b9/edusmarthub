import { useState, useEffect } from 'react';
import { useRealtime } from './useRealtime';

interface OnlineStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}

export function useOnlineStatus(userIds: string[]) {
  const { subscribe, emit } = useRealtime();
  const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());

  useEffect(() => {
    // Request statuses for provided user IDs
    if (userIds.length > 0) {
      emit('user:status-request', { userIds });
    }

    const unsubscribe = subscribe<{ userId: string; status: boolean }>('user:online', ({ userId, status }) => {
      if (userIds.includes(userId)) {
        setStatuses((prev) => {
          const next = new Map(prev);
          next.set(userId, {
            userId,
            status: status ? 'online' : 'offline',
            lastSeen: status ? undefined : new Date().toISOString(),
          });
          return next;
        });
      }
    });

    return unsubscribe;
  }, [subscribe, emit, userIds]);

  const getStatus = (userId: string): OnlineStatus['status'] => {
    return statuses.get(userId)?.status || 'offline';
  };

  const isOnline = (userId: string): boolean => {
    return getStatus(userId) === 'online';
  };

  return {
    statuses: Array.from(statuses.values()),
    getStatus,
    isOnline,
  };
}
