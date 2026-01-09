import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const paymentController = new PaymentController();

// Webhook doesn't require authentication (uses signature verification)
router.post('/webhooks/:gateway', paymentController.webhook);

// Other routes require authentication
router.use(authenticate);

router.post(
  '/',
  generalLimiter,
  authorize(Permission.PAYMENT_CREATE),
  paymentController.createPayment
);

router.post(
  '/:id/process',
  generalLimiter,
  authorize(Permission.PAYMENT_CREATE),
  paymentController.processPayment
);

router.get(
  '/',
  generalLimiter,
  authorize(Permission.PAYMENT_READ),
  paymentController.getPayments
);

export default router;
