import { Request, Response, NextFunction } from 'express';
import { CommunicationService } from './communication.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse, MessageType } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  schoolId: z.string().uuid(),
  subject: z.string().optional(),
  content: z.string().min(1),
  type: z.nativeEnum(MessageType).default(MessageType.DIRECT),
  attachments: z.array(z.string()).optional(),
});

const createAnnouncementSchema = z.object({
  schoolId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  targetRoles: z.array(z.string()).optional(),
  targetClasses: z.array(z.string()).optional(),
});

export class CommunicationController {
  private communicationService: CommunicationService;

  constructor() {
    this.communicationService = new CommunicationService();
  }

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(sendMessageSchema, req.body);
      const message = await this.communicationService.sendMessage({
        ...data,
        senderId: req.user!.userId,
      });

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message sent successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        type: req.query.type as MessageType | undefined,
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await this.communicationService.getMessages(
        req.user!.userId,
        filters
      );

      const response: ApiResponse = {
        success: true,
        data: result.messages,
        pagination: {
          page: Math.floor((filters.offset || 0) / (filters.limit || 10)) + 1,
          limit: filters.limit || 10,
          total: result.total,
          totalPages: Math.ceil(result.total / (filters.limit || 10)),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const message = await this.communicationService.markAsRead(
        id,
        req.user!.userId
      );

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message marked as read',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createAnnouncementSchema, req.body);
      const announcement = await this.communicationService.createAnnouncement({
        ...data,
        senderId: req.user!.userId,
      });

      const response: ApiResponse = {
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
