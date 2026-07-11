
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getShuInfo, simulateLoan, applyLoan, getActiveLoans, getCoopStats } from '../controllers/coop.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', getCoopStats);
router.get('/shu', getShuInfo);
router.post('/loans/simulate', simulateLoan); // Public enough? maybe protected is better.
router.post('/loans/apply', applyLoan);
router.get('/loans/active', getActiveLoans);

export default router;
