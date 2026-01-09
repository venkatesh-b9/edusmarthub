/**
 * Lazy Route Loading Utilities
 * Provides code splitting for AI components and heavy features
 */

import { lazy, LazyExoticComponent, ComponentType } from 'react';

// Preload function type
type PreloadFunction = () => Promise<any>;

/**
 * Create lazy component with preload capability
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadFn?: PreloadFunction
): LazyExoticComponent<T> & { preload?: PreloadFunction } {
  const LazyComponent = lazy(importFn) as LazyExoticComponent<T> & {
    preload?: PreloadFunction;
  };

  if (preloadFn) {
    LazyComponent.preload = preloadFn;
  }

  return LazyComponent;
}

/**
 * Preload AI components
 */
export const preloadAIComponents = async () => {
  const preloads = [
    import('@/components/ai/AITimetableOptimizer'),
    import('@/components/ai/StudentAIDashboard'),
    import('@/components/ai/AIServiceStatus'),
  ];

  await Promise.all(preloads);
};

/**
 * Lazy AI Components
 */
export const AITimetableOptimizer = createLazyComponent(
  () => import('@/components/ai/AITimetableOptimizer'),
  () => import('@/lib/api/services/ai.service.enhanced')
);

export const StudentAIDashboard = createLazyComponent(
  () => import('@/components/ai/StudentAIDashboard'),
  async () => {
    await Promise.all([
      import('@/lib/api/services/ai.service.enhanced'),
      import('@/lib/api/apiService'),
    ]);
  }
);

// AIServiceStatus uses default export
export const AIServiceStatus = lazy(() => 
  import('@/components/ai/AIServiceStatus').then((m: any) => ({ default: m.default }))
) as LazyExoticComponent<ComponentType<any>>;

/**
 * Preload component on hover or focus
 */
export const usePreloadOnHover = (preloadFn: PreloadFunction) => {
  const handleMouseEnter = () => {
    preloadFn();
  };

  const handleFocus = () => {
    preloadFn();
  };

  return {
    onMouseEnter: handleMouseEnter,
    onFocus: handleFocus,
  };
};

/**
 * Preload component on route match
 */
export const preloadOnRouteMatch = (path: string, preloadFn: PreloadFunction) => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith(path)) {
      preloadFn();
    }
  }
};

export default {
  AITimetableOptimizer,
  StudentAIDashboard,
  AIServiceStatus,
  preloadAIComponents,
  usePreloadOnHover,
  preloadOnRouteMatch,
};
