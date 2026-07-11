import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getSavingsInfo, depositSavings, withdrawSavings } from '../controllers/savings.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getSavingsInfo as RequestHandler);
router.post('/deposit', depositSavings as RequestHandler);
router.post('/withdraw', withdrawSavings as RequestHandler);

export default router;
