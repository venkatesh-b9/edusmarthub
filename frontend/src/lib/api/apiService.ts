/**
 * Unified API Service Layer
 * Provides centralized API client with automatic token refresh, rate limiting, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { socketManager } from '@/lib/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY = 1000;

// Rate limiting state
let rateLimitDelay = 0;
let lastRequestTime = 0;

// Request queue for rate limiting
const requestQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig;
}> = [];

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper functions
const getToken = (): string | null => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

const getTenantId = (): string | null => {
  return localStorage.getItem('schoolId') || localStorage.getItem('tenantId');
};

const getUserRole = (): string | null => {
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

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Token refresh function
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    // Refresh failed, logout user
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login?session=expired';
    return null;
  }
};

// Rate limiting handler
const handleRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < rateLimitDelay) {
    const waitTime = rateLimitDelay - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  rateLimitDelay = Math.min(rateLimitDelay * 2, 10000); // Exponential backoff, max 10s
};

// Reset rate limit delay on successful request
const resetRateLimit = (): void => {
  rateLimitDelay = 0;
};

// Process request queue
const processRequestQueue = async (): Promise<void> => {
  if (requestQueue.length === 0) return;

  const { resolve, reject, config } = requestQueue.shift()!;
  try {
    const response = await apiClient(config);
    resolve(response);
  } catch (error) {
    reject(error);
  }

  // Process next request after delay
  setTimeout(processRequestQueue, RATE_LIMIT_DELAY);
};

// Error handler
const errorHandler = (error: any, endpoint: string): void => {
  console.error(`API Error [${endpoint}]:`, error);

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';

    if (status >= 500) {
      toast.error('Server Error', {
        description: 'Please try again later',
      });
    } else if (status !== 401 && status !== 429) {
      toast.error('Error', {
        description: message,
      });
    }
  } else if (error.request) {
    toast.error('Network Error', {
      description: 'Please check your internet connection',
    });
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant context
    const tenantId = getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
      config.headers['X-School-Id'] = tenantId;
    }

    // Add user role
    const userRole = getUserRole();
    if (userRole) {
      config.headers['X-User-Role'] = userRole;
    }

    // Add AI service headers for AI endpoints
    if (config.url?.includes('/ai/')) {
      config.headers['X-AI-Service'] = 'enabled';
      config.headers['X-AI-Version'] = '2.0';
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    resetRateLimit();

    // Transform AI service responses
    if (response.config.url?.includes('/ai/')) {
      return transformAIResponse(response);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Auto refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 Rate Limiting
    if (error.response?.status === 429) {
      rateLimitDelay = error.response.data?.retryAfter
        ? error.response.data.retryAfter * 1000
        : RATE_LIMIT_DELAY;

      await handleRateLimit();

      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return apiClient(originalRequest);
      }
    }

    // Handle AI service errors
    if (originalRequest?.url?.includes('/ai/')) {
      return handleAIError(error);
    }

    errorHandler(error, originalRequest?.url || 'unknown');
    return Promise.reject(error);
  }
);

// Transform AI response
const transformAIResponse = (response: AxiosResponse): AxiosResponse => {
  // Add AI-specific metadata if needed
  if (response.data?.data) {
    response.data.data._aiProcessed = true;
    response.data.data._timestamp = new Date().toISOString();
  }
  return response;
};

// Handle AI errors
const handleAIError = (error: any): Promise<any> => {
  if (error.response?.data?.error) {
    toast.error('AI Service Error', {
      description: error.response.data.error,
    });
  } else {
    toast.error('AI Service Unavailable', {
      description: 'The AI service is temporarily unavailable. Please try again later.',
    });
  }
  return Promise.reject(error);
};

// Main API Service
export const apiService = {
  /**
   * Unified request method with automatic retry and error handling
   */
  request: async <T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    try {
      // Handle rate limiting
      if (rateLimitDelay > 0) {
        await handleRateLimit();
      }

      const response = await apiClient.request<T>({
        url: endpoint,
        method,
        data,
        ...config,
      });

      return response.data as T;
    } catch (error: any) {
      errorHandler(error, endpoint);
      throw error;
    }
  },

  /**
   * GET request
   */
  get: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiService.request<T>(endpoint, 'GET', undefined, config);
  },

  /**
   * POST request
   */
  post: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiService.request<T>(endpoint, 'POST', data, config);
  },

  /**
   * PUT request
   */
  put: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiService.request<T>(endpoint, 'PUT', data, config);
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiService.request<T>(endpoint, 'PATCH', data, config);
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiService.request<T>(endpoint, 'DELETE', undefined, config);
  },

  /**
   * Subscribe to real-time updates via WebSocket
   */
  subscribe: (channel: string, callback: (data: any) => void): (() => void) => {
    socketManager.on(channel, callback);
    return () => socketManager.off(channel, callback);
  },

  /**
   * File upload with progress tracking
   */
  uploadFile: async (
    file: File,
    endpoint: string,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });
    }

    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error: any) {
      errorHandler(error, endpoint);
      throw error;
    }
  },

  /**
   * Poll for async results (e.g., AI processing)
   */
  pollResult: async <T = any>(
    jobId: string,
    endpoint: string,
    interval: number = 2000,
    maxAttempts: number = 30
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        try {
          const response = await apiService.get<{ status: string; result?: T; error?: string }>(
            `${endpoint}/${jobId}`
          );

          if (response.status === 'completed' && response.result) {
            resolve(response.result);
          } else if (response.status === 'failed' || response.error) {
            reject(new Error(response.error || 'Job failed'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Polling timeout'));
          } else {
            attempts++;
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};

export default apiService;
