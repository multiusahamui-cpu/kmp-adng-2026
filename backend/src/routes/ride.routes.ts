
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { calculatePrice, bookRide, updateRideStatus } from '../controllers/ride.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.post('/calculate', calculatePrice as RequestHandler);
router.post('/book', bookRide as RequestHandler);
router.put('/:id/status', updateRideStatus as RequestHandler);

export default router;
