import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticate);

router.get(
  '/aggregate',
  generalLimiter,
  authorize(Permission.ANALYTICS_READ),
  analyticsController.aggregateData
);

router.get(
  '/',
  generalLimiter,
  authorize(Permission.ANALYTICS_READ),
  analyticsController.getAnalytics
);

router.get(
  '/reports/:reportType',
  generalLimiter,
  authorize(Permission.REPORT_GENERATE),
  analyticsController.generateReport
);

export default router;
