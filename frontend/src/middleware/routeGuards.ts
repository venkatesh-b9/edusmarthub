/**
 * Route Guards System
 * Provides role-based, tenant-based, and feature flag-based route protection
 */

import { NavigateFunction, Location } from 'react-router-dom';
import { apiService } from '@/lib/api/apiService';

// Types
export type UserRole = 'super-admin' | 'school-admin' | 'teacher' | 'parent';
export type RouteGuard = (
  to: { pathname: string; search?: string; state?: any },
  from: { pathname: string },
  next: (path?: string | { pathname: string; search?: string }) => void
) => void | Promise<void>;

// Helper functions
const getToken = (): string | null => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

const getUserRole = (): UserRole | null => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.role || null;
    } catch {
      return null;
    }
  }
  return null;
};

const getTenantId = (): string | null => {
  return localStorage.getItem('schoolId') || localStorage.getItem('tenantId');
};

/**
 * Route Guards
 */
export const routeGuards = {
  /**
   * Require authentication
   */
  requireAuth: (): RouteGuard => {
    return (to, from, next) => {
      const token = getToken();
      if (!token) {
        next({ pathname: '/login', search: `?redirect=${encodeURIComponent(to.pathname)}` });
        return;
      }
      next();
    };
  },

  /**
   * Require specific role
   */
  requireRole: (requiredRole: UserRole | UserRole[]): RouteGuard => {
    return (to, from, next) => {
      const userRole = getUserRole();
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!userRole) {
        next({ pathname: '/login' });
        return;
      }

      // Super admin has access to everything
      if (userRole === 'super-admin') {
        next();
        return;
      }

      if (!requiredRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const roleDashboards: Record<UserRole, string> = {
          'super-admin': '/super-admin',
          'school-admin': '/school-admin',
          teacher: '/teacher',
          parent: '/parent',
        };
        next({ pathname: roleDashboards[userRole] || '/login' });
        return;
      }

      next();
    };
  },

  /**
   * Require tenant access
   */
  requireTenantAccess: (): RouteGuard => {
    return (to, from, next) => {
      const tenantId = getTenantId();
      const userRole = getUserRole();

      // Super admin can access any tenant
      if (userRole === 'super-admin') {
        next();
        return;
      }

      // Extract tenant ID from route params or query
      const routeTenantId =
        (to as any).params?.tenantId || (to as any).params?.schoolId || (to as any).query?.tenant_id;

      if (!tenantId) {
        next({ pathname: '/login' });
        return;
      }

      if (routeTenantId && routeTenantId !== tenantId && userRole !== 'super-admin') {
        next({ pathname: '/access-denied' });
        return;
      }

      next();
    };
  },

  /**
   * Require feature flag
   */
  requireFeature: (featureName: string): RouteGuard => {
    return async (to, from, next) => {
      try {
        const response = await apiService.get<{ enabled: boolean; message?: string }>(
          `/features/${featureName}/status`
        );

        if (response.enabled) {
          next();
        } else {
          next({
            pathname: '/feature-disabled',
            search: `?feature=${encodeURIComponent(featureName)}`,
          });
        }
      } catch (error) {
        console.error(`Feature check failed for ${featureName}:`, error);
        next({ pathname: '/feature-unavailable' });
      }
    };
  },

  /**
   * Require multiple conditions (AND logic)
   */
  requireAll: (...guards: RouteGuard[]): RouteGuard => {
    return async (to, from, next) => {
      let redirectPath: string | undefined;

      for (const guard of guards) {
        await new Promise<void>((resolve) => {
          guard(
            to,
            from,
            (path?: string | { pathname: string; search?: string }) => {
              if (path) {
                redirectPath =
                  typeof path === 'string' ? path : path.pathname + (path.search || '');
              }
              resolve();
            }
          );
        });

        if (redirectPath) {
          next(redirectPath);
          return;
        }
      }

      next();
    };
  },

  /**
   * Require any condition (OR logic)
   */
  requireAny: (...guards: RouteGuard[]): RouteGuard => {
    return async (to, from, next) => {
      const results: Array<{ passed: boolean; redirect?: string }> = [];

      for (const guard of guards) {
        await new Promise<void>((resolve) => {
          let redirectPath: string | undefined;

          guard(
            to,
            from,
            (path?: string | { pathname: string; search?: string }) => {
              if (path) {
                redirectPath =
                  typeof path === 'string' ? path : path.pathname + (path.search || '');
                results.push({ passed: false, redirect: redirectPath });
              } else {
                results.push({ passed: true });
              }
              resolve();
            }
          );
        });
      }

      const passed = results.some((r) => r.passed);
      if (passed) {
        next();
      } else {
        // Use first redirect or default
        const redirect = results.find((r) => r.redirect)?.redirect || '/unauthorized';
        next(redirect);
      }
    };
  },
};

/**
 * React Router compatible guard wrapper
 */
export const createRouteGuard = (
  guard: RouteGuard
): ((navigate: NavigateFunction, location: Location) => boolean) => {
  return (navigate, location) => {
    let shouldNavigate = false;
    let targetPath: string | undefined;

    guard(
      { pathname: location.pathname, search: location.search, state: location.state },
      { pathname: document.referrer || '/' },
      (path?: string | { pathname: string; search?: string }) => {
        if (path) {
          shouldNavigate = true;
          targetPath = typeof path === 'string' ? path : path.pathname + (path.search || '');
        }
      }
    );

    if (shouldNavigate && targetPath) {
      navigate(targetPath);
      return false;
    }

    return true;
  };
};

export default routeGuards;
