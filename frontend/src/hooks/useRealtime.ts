import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { socketManager } from '@/lib/socket';
import { setConnectionStatus } from '@/store/slices/realtimeSlice';

export function useRealtime() {
  const dispatch = useAppDispatch();
  const { connectionStatus, isConnected } = useAppSelector((state) => state.realtime);
  const callbacksRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  useEffect(() => {
    // Connect socket on mount
    socketManager.connect();

    // Listen to connection changes
    const unsubscribe = socketManager.onConnectionChange((connected) => {
      dispatch(setConnectionStatus(connected ? 'connected' : 'disconnected'));
    });

    return () => {
      unsubscribe();
      // Clean up event listeners
      callbacksRef.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          socketManager.off(event, callback);
        });
      });
      callbacksRef.current.clear();
    };
  }, [dispatch]);

  const subscribe = useCallback(<T = any>(event: string, callback: (data: T) => void) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)!.add(callback);

    socketManager.on(event, callback);

    return () => {
      const callbacks = callbacksRef.current.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
      socketManager.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data?: any, options?: { queue?: boolean; ack?: (response: any) => void }) => {
    socketManager.emit(event, data, options);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketManager.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketManager.leaveRoom(room);
  }, []);

  return {
    isConnected,
    connectionStatus,
    subscribe,
    emit,
    joinRoom,
    leaveRoom,
    socketId: socketManager.getSocketId(),
  };
}
