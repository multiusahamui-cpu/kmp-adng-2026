
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload, validateFileContent } from '../middleware/upload.middleware';
import { uploadFile } from '../controllers/upload.controller';

const router = Router();

// Endpoint: POST /api/v1/upload
// Key form-data: 'file'
router.post('/', authenticate, upload.single('file'), validateFileContent, uploadFile);

export default router;
