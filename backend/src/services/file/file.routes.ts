import { Router } from 'express';
import { FileController } from './file.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const fileController = new FileController();

router.use(authenticate);

router.post(
  '/upload',
  generalLimiter,
  authorize(Permission.FILE_UPLOAD),
  fileController.getUploadMiddleware(),
  fileController.uploadFile
);

router.get(
  '/files',
  generalLimiter,
  authorize(Permission.FILE_READ),
  fileController.getFiles
);

router.get(
  '/files/:id/url',
  generalLimiter,
  authorize(Permission.FILE_READ),
  fileController.getFileUrl
);

router.delete(
  '/files/:id',
  generalLimiter,
  authorize(Permission.FILE_DELETE),
  fileController.deleteFile
);

export default router;
