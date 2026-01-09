import { Router } from 'express';
import { SchoolController } from './school.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const schoolController = new SchoolController();

router.use(authenticate);

router.get(
  '/',
  generalLimiter,
  authorize(Permission.SCHOOL_READ),
  schoolController.getSchools
);

router.get(
  '/:id',
  generalLimiter,
  authorize(Permission.SCHOOL_READ),
  schoolController.getSchoolById
);

router.post(
  '/',
  generalLimiter,
  authorize(Permission.SCHOOL_CREATE),
  schoolController.createSchool
);

router.put(
  '/:id',
  generalLimiter,
  authorize(Permission.SCHOOL_UPDATE),
  schoolController.updateSchool
);

export default router;
