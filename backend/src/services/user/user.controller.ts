import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse, PaginationMeta } from '../../shared/types';
import { idSchema, paginationSchema } from '../../shared/utils/validation';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['super_admin', 'school_admin', 'teacher', 'parent', 'student']),
  schoolId: z.string().uuid().optional(),
  phoneNumber: z.string().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

const bulkImportSchema = z.object({
  users: z.array(createUserSchema),
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = validate(paginationSchema, req.query);
      const filters = {
        schoolId: req.query.schoolId as string | undefined,
        role: req.query.role as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const users = await this.userService.bulkExport(filters);
      
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedUsers = users.slice(start, end);

      const paginationMeta: PaginationMeta = {
        page: pagination.page,
        limit: pagination.limit,
        total: users.length,
        totalPages: Math.ceil(users.length / pagination.limit),
      };

      const response: ApiResponse = {
        success: true,
        data: paginatedUsers,
        pagination: paginationMeta,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const user = await this.userService.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createUserSchema, req.body);
      const user = await this.userService.create(data);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const data = validate(updateUserSchema, req.body);
      const user = await this.userService.update(id, data);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      await this.userService.delete(id);

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  bulkImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { users } = validate(bulkImportSchema, req.body);
      const result = await this.userService.bulkImport(users);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: `Imported ${result.success} users, ${result.failed} failed`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  bulkExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        schoolId: req.query.schoolId as string | undefined,
        role: req.query.role as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const users = await this.userService.bulkExport(filters);

      const response: ApiResponse = {
        success: true,
        data: users,
        message: `Exported ${users.length} users`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
