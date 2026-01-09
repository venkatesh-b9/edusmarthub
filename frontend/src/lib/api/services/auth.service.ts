import apiClient from '../config';

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('token', accessToken); // For backward compatibility
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    if (user.schoolId) {
      localStorage.setItem('schoolId', user.schoolId);
    }
    
    return response.data.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    if (user.schoolId) {
      localStorage.setItem('schoolId', user.schoolId);
    }
    
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return response.data.data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('schoolId');
  },

  async setupMFA(method: 'sms' | 'email' | 'authenticator'): Promise<any> {
    const response = await apiClient.post('/auth/mfa/setup', { method });
    return response.data.data;
  },

  async verifyMFA(code: string, secret?: string): Promise<void> {
    await apiClient.post('/auth/mfa/verify', { code, secret });
  },

  async initiateOAuth(provider: 'google' | 'microsoft'): Promise<{ authUrl: string }> {
    const response = await apiClient.get(`/auth/oauth/${provider}`);
    return response.data.data;
  },
};
