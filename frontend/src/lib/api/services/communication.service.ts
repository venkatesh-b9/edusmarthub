import apiClient from '../config';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  schoolId: string;
  subject?: string;
  content: string;
  type: 'direct' | 'announcement' | 'notification';
  isRead: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface CreateMessageData {
  recipientId: string;
  schoolId: string;
  subject?: string;
  content: string;
  type?: Message['type'];
  attachments?: string[];
}

export interface AnnouncementData {
  schoolId: string;
  subject: string;
  content: string;
  targetRoles?: string[];
  targetClasses?: string[];
}

export const communicationService = {
  async sendMessage(data: CreateMessageData): Promise<Message> {
    const response = await apiClient.post('/communication/messages', data);
    return response.data.data;
  },

  async getMessages(params?: {
    type?: Message['type'];
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get('/communication/messages', { params });
    return response.data;
  },

  async markAsRead(messageId: string): Promise<Message> {
    const response = await apiClient.put(`/communication/messages/${messageId}/read`);
    return response.data.data;
  },

  async createAnnouncement(data: AnnouncementData): Promise<Message> {
    const response = await apiClient.post('/communication/announcements', data);
    return response.data.data;
  },
};
