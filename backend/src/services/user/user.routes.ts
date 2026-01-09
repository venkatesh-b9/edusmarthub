import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize, requireRole, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Get users (with pagination and filters)
router.get(
  '/',
  generalLimiter,
  authorize(Permission.USER_READ),
  userController.getUsers
);

// Get user by ID
router.get(
  '/:id',
  generalLimiter,
  authorize(Permission.USER_READ),
  userController.getUserById
);

// Create user (admin only)
router.post(
  '/',
  generalLimiter,
  authorize(Permission.USER_CREATE),
  userController.createUser
);

// Update user
router.put(
  '/:id',
  generalLimiter,
  authorize(Permission.USER_UPDATE),
  userController.updateUser
);

// Delete user (soft delete)
router.delete(
  '/:id',
  generalLimiter,
  authorize(Permission.USER_DELETE),
  userController.deleteUser
);

// Bulk import
router.post(
  '/bulk/import',
  generalLimiter,
  authorize(Permission.USER_CREATE),
  userController.bulkImport
);

// Bulk export
router.get(
  '/bulk/export',
  generalLimiter,
  authorize(Permission.USER_READ),
  userController.bulkExport
);

export default router;
