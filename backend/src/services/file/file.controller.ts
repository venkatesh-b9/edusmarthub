import { Request, Response, NextFunction } from 'express';
import { FileService } from './file.service';
import { ApiResponse } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';
import { validate } from '../../shared/utils/validation';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx').split(',');
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (fileExtension && allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
});

export class FileController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }

      const schoolId = req.user!.schoolId || req.body.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      const file = await this.fileService.uploadFile(
        req.file,
        req.user!.userId,
        schoolId,
        req.body.metadata ? JSON.parse(req.body.metadata) : undefined
      );

      const response: ApiResponse = {
        success: true,
        data: file,
        message: 'File uploaded successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getFileUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string) : 3600;

      const url = await this.fileService.getFileUrl(id, expiresIn);

      const response: ApiResponse = {
        success: true,
        data: { url, expiresIn },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      await this.fileService.deleteFile(id);

      const response: ApiResponse = {
        success: true,
        message: 'File deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user!.schoolId || req.query.schoolId as string;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      const filters = {
        uploadedBy: req.query.uploadedBy as string | undefined,
        mimeType: req.query.mimeType as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await this.fileService.getFilesBySchool(schoolId, filters);

      const response: ApiResponse = {
        success: true,
        data: result.files,
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

  getUploadMiddleware() {
    return upload.single('file');
  }
}
