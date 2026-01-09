import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from './useRealtime';
import { debounce } from '@/lib/utils';

interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
  startTime: number;
}

export function useTypingIndicator(conversationId: string, userId: string) {
  const { emit, subscribe } = useRealtime();
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Send typing start/stop events
  const sendTypingStart = useCallback(
    debounce(() => {
      emit('typing:start', { userId, conversationId });
    }, 300),
    [emit, userId, conversationId]
  );

  const sendTypingStop = useCallback(() => {
    emit('typing:stop', { userId, conversationId });
  }, [emit, userId, conversationId]);

  useEffect(() => {
    const unsubscribeStart = subscribe<{ userId: string; userName?: string; conversationId: string }>(
      'typing:start',
      (data) => {
        if (data.conversationId === conversationId && data.userId !== userId) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.set(data.userId, {
              userId: data.userId,
              userName: data.userName || 'User',
              conversationId: data.conversationId,
              startTime: Date.now(),
            });
            return next;
          });

          // Clear existing timeout
          const existingTimeout = typingTimeoutRef.current.get(data.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set timeout to remove typing indicator after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(data.userId);
              return next;
            });
            typingTimeoutRef.current.delete(data.userId);
          }, 3000);

          typingTimeoutRef.current.set(data.userId, timeout);
        }
      }
    );

    const unsubscribeStop = subscribe<{ userId: string; conversationId: string }>('typing:stop', (data) => {
      if (data.conversationId === conversationId && data.userId !== userId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });

        const timeout = typingTimeoutRef.current.get(data.userId);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeoutRef.current.delete(data.userId);
        }
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeStop();
      // Clean up timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      // Send typing stop on unmount
      sendTypingStop();
    };
  }, [conversationId, userId, subscribe, sendTypingStop]);

  const getTypingText = useCallback(() => {
    const users = Array.from(typingUsers.values());
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].userName} is typing...`;
    if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing...`;
    return `${users.length} people are typing...`;
  }, [typingUsers]);

  return {
    typingUsers: Array.from(typingUsers.values()),
    typingText: getTypingText(),
    sendTypingStart,
    sendTypingStop,
  };
}
