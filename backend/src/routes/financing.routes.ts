
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { proposeProject, getMyProjects, addExpense } from '../controllers/financing.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/projects', getMyProjects as RequestHandler);
router.post('/propose', proposeProject as RequestHandler);
router.post('/projects/:id/expense', addExpense as RequestHandler);

export default router;
