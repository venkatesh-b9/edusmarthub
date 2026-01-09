import apiClient from '../config';

export interface FileUpload {
  id: string;
  schoolId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export const fileService = {
  async uploadFile(
    file: File,
    metadata?: Record<string, any>
  ): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getFiles(params?: {
    uploadedBy?: string;
    mimeType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    files: FileUpload[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get('/files/files', { params });
    return response.data;
  },

  async getFileUrl(fileId: string, expiresIn?: number): Promise<{ url: string; expiresIn: number }> {
    const response = await apiClient.get(`/files/files/${fileId}/url`, {
      params: { expiresIn },
    });
    return response.data.data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/files/files/${fileId}`);
  },
};
