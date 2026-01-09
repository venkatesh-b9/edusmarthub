import apiClient from '../config';

export interface School {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
  };
  settings?: {
    academicYear: string;
    terms: string[];
    timezone: string;
    locale: string;
  };
  isActive: boolean;
}

export interface CreateSchoolData {
  name: string;
  code: string;
  subdomain: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  settings?: {
    academicYear?: string;
    terms?: string[];
    timezone?: string;
    locale?: string;
  };
}

export const schoolService = {
  async getSchools(): Promise<School[]> {
    const response = await apiClient.get('/schools');
    return response.data.data;
  },

  async getSchoolById(id: string): Promise<School> {
    const response = await apiClient.get(`/schools/${id}`);
    return response.data.data;
  },

  async createSchool(data: CreateSchoolData): Promise<School> {
    const response = await apiClient.post('/schools', data);
    return response.data.data;
  },

  async updateSchool(id: string, data: Partial<CreateSchoolData>): Promise<School> {
    const response = await apiClient.put(`/schools/${id}`, data);
    return response.data.data;
  },
};
