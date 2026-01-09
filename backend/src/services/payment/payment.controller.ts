import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse, PaymentGateway } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';

const createPaymentSchema = z.object({
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  parentId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  invoiceId: z.string().uuid(),
  dueDate: z.string().transform((str) => new Date(str)),
  gateway: z.nativeEnum(PaymentGateway),
});

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createPaymentSchema, req.body);
      const payment = await this.paymentService.createPayment(data);

      const response: ApiResponse = {
        success: true,
        data: payment,
        message: 'Payment created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(idSchema, req.params);
      const payment = await this.paymentService.processPayment(id);

      const response: ApiResponse = {
        success: true,
        data: payment,
        message: 'Payment processed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parentId = req.query.parentId as string;
      const studentId = req.query.studentId as string;

      let payments;
      if (parentId) {
        payments = await this.paymentService.getPaymentsByParent(parentId);
      } else if (studentId) {
        payments = await this.paymentService.getPaymentsByStudent(studentId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'parentId or studentId is required',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: payments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gateway = req.params.gateway as PaymentGateway;
      const signature = req.headers['stripe-signature'] as string;

      await this.paymentService.handleWebhook(
        gateway,
        req.body,
        signature
      );

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  };
}
