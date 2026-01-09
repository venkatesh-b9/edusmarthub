import { Request, Response, NextFunction } from 'express';
import { SchoolService } from './school.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';

const createSchoolSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  subdomain: z.string().min(1),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  branding: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
  settings: z.object({
    academicYear: z.string().optional(),
    terms: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
});

const updateSchoolSchema = createSchoolSchema.partial();

export class SchoolController {
  private schoolService: SchoolService;

  constructor() {
    this.schoolService = new SchoolService();
  }

  getSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schools = await this.schoolService.getAll();

      const response: ApiResponse = {
        success: true,
        data: schools,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getSchoolById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const school = await this.schoolService.findById(id);

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: school,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  createSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createSchoolSchema, req.body);
      const school = await this.schoolService.create(data);

      const response: ApiResponse = {
        success: true,
        data: school,
        message: 'School created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const data = validate(updateSchoolSchema, req.body);
      const school = await this.schoolService.update(id, data);

      const response: ApiResponse = {
        success: true,
        data: school,
        message: 'School updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
