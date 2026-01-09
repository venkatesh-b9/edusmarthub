import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from './useRealtime';
import { useAppDispatch } from '@/store/hooks';
import { setAnalyticsData } from '@/store/slices/analyticsSlice';
import { setSchools } from '@/store/slices/schoolSlice';
import { setStudents } from '@/store/slices/studentSlice';
import { setTeachers } from '@/store/slices/teacherSlice';
import { debounce, throttle } from '@/lib/utils';

interface DashboardUpdates {
  analytics?: any;
  schools?: any[];
  students?: any[];
  teachers?: any[];
  stats?: {
    totalSchools?: number;
    totalStudents?: number;
    totalTeachers?: number;
    avgPerformance?: number;
  };
}

export function useLiveDashboard(interval: number = 5000) {
  const { subscribe, isConnected } = useRealtime();
  const dispatch = useAppDispatch();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const updateQueueRef = useRef<DashboardUpdates[]>([]);

  // Subscribe to dashboard updates
  useEffect(() => {
    if (!isConnected || isPaused) return;

    const unsubscribe = subscribe<DashboardUpdates>('dashboard:update', (updates) => {
      updateQueueRef.current.push(updates);
      setUpdateCount((prev) => prev + 1);
    });

    // Process update queue with throttling
    const processQueue = throttle(() => {
      if (updateQueueRef.current.length === 0) return;

      const latestUpdate = updateQueueRef.current[updateQueueRef.current.length - 1];
      updateQueueRef.current = [];

      if (latestUpdate.analytics) {
        dispatch(setAnalyticsData(latestUpdate.analytics));
      }
      if (latestUpdate.schools) {
        dispatch(setSchools(latestUpdate.schools));
      }
      if (latestUpdate.students) {
        dispatch(setStudents(latestUpdate.students));
      }
      if (latestUpdate.teachers) {
        dispatch(setTeachers(latestUpdate.teachers));
      }

      setLastUpdate(new Date());
    }, interval);

    const intervalId = setInterval(processQueue, interval);
    processQueue(); // Process immediately

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [subscribe, isConnected, isPaused, interval, dispatch]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    updateQueueRef.current = [];
    setUpdateCount(0);
    setLastUpdate(null);
  }, []);

  return {
    isConnected,
    lastUpdate,
    updateCount,
    isPaused,
    pause,
    resume,
    reset,
  };
}
