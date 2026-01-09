import { Router } from 'express';
import { CommunicationController } from './communication.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const communicationController = new CommunicationController();

router.use(authenticate);

router.post(
  '/messages',
  generalLimiter,
  authorize(Permission.MESSAGE_SEND),
  communicationController.sendMessage
);

router.get(
  '/messages',
  generalLimiter,
  authorize(Permission.MESSAGE_READ),
  communicationController.getMessages
);

router.put(
  '/messages/:id/read',
  generalLimiter,
  authorize(Permission.MESSAGE_READ),
  communicationController.markAsRead
);

router.post(
  '/announcements',
  generalLimiter,
  authorize(Permission.ANNOUNCEMENT_CREATE),
  communicationController.createAnnouncement
);

export default router;
