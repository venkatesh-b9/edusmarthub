import apiClient from '../config';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  isActive: boolean;
  phoneNumber?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  phoneNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    schoolId?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async bulkImport(users: CreateUserData[]): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    const response = await apiClient.post('/users/bulk/import', { users });
    return response.data.data;
  },

  async bulkExport(filters?: {
    schoolId?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    const response = await apiClient.get('/users/bulk/export', { params: filters });
    return response.data.data;
  },
};
