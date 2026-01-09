import { z } from 'zod';
import { ValidationResult, ValidationError, ValidationWarning } from '../types';
import { config } from '../config';
import logger from './logger';

export class DataValidator {
  private schemas: Map<string, z.ZodSchema> = new Map();

  constructor() {
    this.initializeSchemas();
  }

  private initializeSchemas(): void {
    // Attendance schema
    this.schemas.set('attendance', z.object({
      studentId: z.string().uuid(),
      classId: z.string().uuid(),
      date: z.string().or(z.date()),
      status: z.enum(['present', 'absent', 'late', 'excused']),
    }));

    // Grade schema
    this.schemas.set('grade', z.object({
      studentId: z.string().uuid(),
      classId: z.string().uuid(),
      subject: z.string(),
      score: z.number().min(0).max(100),
      maxScore: z.number().positive(),
    }));

    // User schema
    this.schemas.set('user', z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.string(),
    }));
  }

  async validate(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      recordId: data.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Get schema based on data type
      const schema = this.schemas.get(data.type || 'unknown');

      if (schema) {
        const parsed = schema.safeParse(data.data || data);

        if (!parsed.success) {
          result.isValid = false;
          result.errors = parsed.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }));
        }
      } else {
        // No schema found - perform basic validation
        result.warnings.push({
          field: 'type',
          message: `No validation schema found for type: ${data.type}`,
          code: 'NO_SCHEMA',
        });
      }

      // Additional custom validations
      this.performCustomValidations(data, result);

      return result;
    } catch (error: any) {
      logger.error(`Validation error: ${error.message}`);
      result.isValid = false;
      result.errors.push({
        field: 'validation',
        message: error.message,
        code: 'VALIDATION_ERROR',
      });
      return result;
    }
  }

  private performCustomValidations(data: any, result: ValidationResult): void {
    // Check for required fields
    if (data.data) {
      if (!data.data.timestamp && !data.timestamp) {
        result.warnings.push({
          field: 'timestamp',
          message: 'Missing timestamp field',
          code: 'MISSING_TIMESTAMP',
        });
      }

      // Check for data quality issues
      if (data.type === 'grade' && data.data.score) {
        if (data.data.score < 0 || data.data.score > 100) {
          result.errors.push({
            field: 'score',
            message: 'Score must be between 0 and 100',
            code: 'INVALID_SCORE',
          });
          result.isValid = false;
        }
      }
    }
  }

  registerSchema(type: string, schema: z.ZodSchema): void {
    this.schemas.set(type, schema);
    logger.info(`Registered validation schema for type: ${type}`);
  }
}
