
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { proposeProject, getMyProjects, addExpense } from '../controllers/financing.controller';

const router = Router();

router.use(authenticate);

router.get('/projects', getMyProjects);
router.post('/propose', proposeProject);
router.post('/projects/:id/expense', addExpense);

export default router;
