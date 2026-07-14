
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getShuInfo, simulateLoan, applyLoan, getActiveLoans, getCoopStats } from '../controllers/coop.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/stats', getCoopStats as RequestHandler);
router.get('/shu', getShuInfo as RequestHandler);
router.post('/loans/simulate', simulateLoan as RequestHandler); // Public enough? maybe protected is better.
router.post('/loans/apply', applyLoan as RequestHandler);
router.get('/loans/active', getActiveLoans as RequestHandler);

export default router;
