
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllContent, createContent, deleteContent, moderateContent } from '../controllers/content.controller';

const router = Router();

router.get('/', getAllContent); // Public read
router.post('/', authenticate, createContent);
router.delete('/:id', authenticate, deleteContent);
router.put('/:id/moderate', authenticate, moderateContent); // NEW

export default router;
