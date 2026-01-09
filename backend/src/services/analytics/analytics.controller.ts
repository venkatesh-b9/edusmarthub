import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse } from '../../shared/types';

const analyticsQuerySchema = z.object({
  schoolId: z.string().uuid(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  aggregateData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(analyticsQuerySchema, req.query);
      const analytics = await this.analyticsService.aggregateData(
        data.schoolId,
        data.startDate,
        data.endDate
      );

      const response: ApiResponse = {
        success: true,
        data: analytics,
        message: 'Analytics aggregated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(analyticsQuerySchema, req.query);
      const analytics = await this.analyticsService.getAnalytics(
        data.schoolId,
        data.startDate,
        data.endDate
      );

      const response: ApiResponse = {
        success: true,
        data: analytics,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  generateReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportType } = req.params;
      const data = validate(analyticsQuerySchema, req.query);

      const report = await this.analyticsService.generateReport(
        data.schoolId,
        reportType,
        data.startDate,
        data.endDate
      );

      const response: ApiResponse = {
        success: true,
        data: report,
        message: 'Report generated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
