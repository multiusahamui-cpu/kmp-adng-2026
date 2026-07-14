
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAllContent, createContent, deleteContent, moderateContent } from '../controllers/content.controller';

const router = Router();

router.get('/', getAllContent as RequestHandler); // Public read
router.post('/', authenticate as RequestHandler, createContent as RequestHandler);
router.delete('/:id', authenticate as RequestHandler, deleteContent as RequestHandler);
router.put('/:id/moderate', authenticate as RequestHandler, moderateContent as RequestHandler); // NEW

export default router;
