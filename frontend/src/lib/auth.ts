import { authService } from './api';
import { socketManager } from './socket';
import { toast } from 'sonner';

/**
 * Logout function that clears all session data and redirects to login
 */
export async function logout(): Promise<void> {
  try {
    // Call backend logout API if token exists
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      try {
        await authService.logout();
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
      }
    }

    // Disconnect Socket.io
    socketManager.disconnect();

    // Clear all localStorage data
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('schoolId');

    // Clear sessionStorage
    sessionStorage.clear();

    toast.success('Logged out successfully');

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if there's an error
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  return !!(token && user);
}
