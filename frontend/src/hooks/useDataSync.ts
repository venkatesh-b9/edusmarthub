/**
 * useDataSync Hook
 * Provides real-time data synchronization with WebSocket support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/lib/api/apiService';
import { socketManager } from '@/lib/socket';

export interface UseDataSyncOptions {
  realtime?: boolean;
  channel?: string;
  interval?: number;
  enabled?: boolean;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseDataSyncReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  lastSync: Date | null;
  refetch: () => Promise<void>;
  updateItem: (id: string, updates: Partial<T>) => void;
  deleteItem: (id: string) => void;
  addItem: (item: T) => void;
}

/**
 * Hook for data synchronization with real-time updates
 */
export function useDataSync<T extends { id: string }>(
  endpoint: string,
  options: UseDataSyncOptions = {}
): UseDataSyncReturn<T> {
  const {
    realtime = false,
    channel,
    interval,
    enabled = true,
    onUpdate,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get<{ data: T[] } | T[]>(endpoint);
      const fetchedData = Array.isArray(response) ? response : (response as any).data || [];

      setData(fetchedData);
      setLastSync(new Date());

      if (onUpdate) {
        onUpdate(fetchedData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, onUpdate, onError]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !enabled) return;

    const updateChannel = channel || `${endpoint}/updates`;

    const unsubscribe = apiService.subscribe(updateChannel, (update: any) => {
      if (update.type === 'CREATE' && update.data) {
        setData((prev) => {
          // Check if item already exists
          const exists = prev.some((item) => item.id === update.data.id);
          if (exists) return prev;
          return [...prev, update.data];
        });
      } else if (update.type === 'UPDATE' && update.data) {
        setData((prev) =>
          prev.map((item) => (item.id === update.data.id ? update.data : item))
        );
      } else if (update.type === 'DELETE' && update.data?.id) {
        setData((prev) => prev.filter((item) => item.id !== update.data.id));
      }

      setLastSync(new Date());

      if (onUpdate) {
        onUpdate(update.data);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [realtime, channel, endpoint, enabled, onUpdate]);

  // Polling interval
  useEffect(() => {
    if (interval && enabled && !realtime) {
      intervalRef.current = setInterval(fetchData, interval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [interval, enabled, realtime, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Update item locally
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  // Delete item locally
  const deleteItem = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Add item locally
  const addItem = useCallback((item: T) => {
    setData((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

  return {
    data,
    loading,
    error,
    lastSync,
    refetch: fetchData,
    updateItem,
    deleteItem,
    addItem,
  };
}

export default useDataSync;
