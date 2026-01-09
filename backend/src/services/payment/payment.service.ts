import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentGateway } from '../../shared/types';
import { NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';
import { publishMessage } from '../../config/rabbitmq';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  async createPayment(data: {
    schoolId: string;
    studentId: string;
    parentId: string;
    amount: number;
    currency: string;
    invoiceId: string;
    dueDate: Date;
    gateway: PaymentGateway;
  }): Promise<Payment> {
    let transactionId: string | undefined;

    // Process payment based on gateway
    if (data.gateway === PaymentGateway.STRIPE) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          schoolId: data.schoolId,
          studentId: data.studentId,
          parentId: data.parentId,
          invoiceId: data.invoiceId,
        },
      });
      transactionId = paymentIntent.id;
    }

    const [result] = await sequelize.query(
      `INSERT INTO payments (id, "schoolId", "studentId", "parentId", amount, currency, status, gateway, "transactionId", "invoiceId", "dueDate", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :schoolId, :studentId, :parentId, :amount, :currency, :status, :gateway, :transactionId, :invoiceId, :dueDate, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          schoolId: data.schoolId,
          studentId: data.studentId,
          parentId: data.parentId,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.PENDING,
          gateway: data.gateway,
          transactionId: transactionId || null,
          invoiceId: data.invoiceId,
          dueDate: data.dueDate,
        },
        type: QueryTypes.SELECT,
      }
    ) as Payment[];

    logger.info(`Payment created: ${result.id} for student ${data.studentId}`);
    return result;
  }

  async processPayment(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Payment is not in pending status');
    }

    // Update status to processing
    await this.updateStatus(paymentId, PaymentStatus.PROCESSING);

    try {
      // Process based on gateway
      if (payment.gateway === PaymentGateway.STRIPE && payment.transactionId) {
        const paymentIntent = await stripe.paymentIntents.confirm(
          payment.transactionId
        );

        if (paymentIntent.status === 'succeeded') {
          await this.updateStatus(paymentId, PaymentStatus.COMPLETED);
          await this.updatePaidAt(paymentId);

          // Publish notification
          await publishMessage('notifications', {
            type: 'payment_completed',
            data: payment,
            parentId: payment.parentId,
          });
        }
      }

      const updatedPayment = await this.findById(paymentId);
      return updatedPayment!;
    } catch (error) {
      await this.updateStatus(paymentId, PaymentStatus.FAILED);
      throw error;
    }
  }

  async handleWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature: string
  ): Promise<void> {
    if (gateway === PaymentGateway.STRIPE) {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const payment = await this.findByTransactionId(paymentIntent.id);

        if (payment) {
          await this.updateStatus(payment.id, PaymentStatus.COMPLETED);
          await this.updatePaidAt(payment.id);

          await publishMessage('notifications', {
            type: 'payment_completed',
            data: payment,
            parentId: payment.parentId,
          });
        }
      }
    }
  }

  async getPaymentsByParent(parentId: string): Promise<Payment[]> {
    const payments = await sequelize.query(
      `SELECT * FROM payments WHERE "parentId" = :parentId ORDER BY "createdAt" DESC`,
      {
        replacements: { parentId },
        type: QueryTypes.SELECT,
      }
    ) as Payment[];

    return payments;
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    const payments = await sequelize.query(
      `SELECT * FROM payments WHERE "studentId" = :studentId ORDER BY "createdAt" DESC`,
      {
        replacements: { studentId },
        type: QueryTypes.SELECT,
      }
    ) as Payment[];

    return payments;
  }

  async findById(id: string): Promise<Payment | null> {
    const [payment] = await sequelize.query(
      `SELECT * FROM payments WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    ) as Payment[];

    return payment || null;
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const [payment] = await sequelize.query(
      `SELECT * FROM payments WHERE "transactionId" = :transactionId LIMIT 1`,
      {
        replacements: { transactionId },
        type: QueryTypes.SELECT,
      }
    ) as Payment[];

    return payment || null;
  }

  private async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    await sequelize.query(
      `UPDATE payments SET status = :status, "updatedAt" = NOW() WHERE id = :id`,
      {
        replacements: { id, status },
      }
    );
  }

  private async updatePaidAt(id: string): Promise<void> {
    await sequelize.query(
      `UPDATE payments SET "paidAt" = NOW(), "updatedAt" = NOW() WHERE id = :id`,
      {
        replacements: { id },
      }
    );
  }
}
