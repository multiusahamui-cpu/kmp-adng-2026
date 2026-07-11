
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateStatus, updateLocation, getNearbyTraders, addMenu } from '../controllers/trader.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.put('/status', updateStatus as RequestHandler);
router.put('/location', updateLocation as RequestHandler);
router.get('/nearby', getNearbyTraders as RequestHandler);
router.post('/menu', addMenu as RequestHandler);

export default router;
