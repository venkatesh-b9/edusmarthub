import { Request, Response, NextFunction } from 'express';
import { AcademicsService } from './academics.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse, AssessmentType } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';

const createAssessmentSchema = z.object({
  schoolId: z.string().uuid(),
  classId: z.string().uuid(),
  subject: z.string().min(1),
  title: z.string().min(1),
  type: z.nativeEnum(AssessmentType),
  maxScore: z.number().positive(),
  weight: z.number().min(0).max(100),
  dueDate: z.string().transform((str) => new Date(str)),
  rubric: z.any().optional(),
});

const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  subject: z.string().min(1),
  assessmentId: z.string().uuid(),
  score: z.number().min(0),
  maxScore: z.number().positive(),
  remarks: z.string().optional(),
});

export class AcademicsController {
  private academicsService: AcademicsService;

  constructor() {
    this.academicsService = new AcademicsService();
  }

  createAssessment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createAssessmentSchema, req.body);
      const assessment = await this.academicsService.createAssessment(data);

      const response: ApiResponse = {
        success: true,
        data: assessment,
        message: 'Assessment created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  createGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createGradeSchema, req.body);
      const grade = await this.academicsService.createGrade({
        ...data,
        gradedBy: req.user!.userId,
      });

      const response: ApiResponse = {
        success: true,
        data: grade,
        message: 'Grade created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getGrades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = validate(z.object({ studentId: z.string().uuid() }), req.params);
      const classId = req.query.classId as string | undefined;
      const subject = req.query.subject as string | undefined;

      const grades = await this.academicsService.getGradesByStudent(
        studentId,
        classId,
        subject
      );

      const response: ApiResponse = {
        success: true,
        data: grades,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = validate(z.object({ studentId: z.string().uuid() }), req.params);
      const classId = req.query.classId as string;

      if (!classId) {
        return res.status(400).json({
          success: false,
          error: 'classId is required',
        });
      }

      const progress = await this.academicsService.getStudentProgress(
        studentId,
        classId
      );

      const response: ApiResponse = {
        success: true,
        data: progress,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
