import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createOrder, getMyOrders } from '../controllers/order.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.post('/', createOrder as RequestHandler);
router.get('/', getMyOrders as RequestHandler);

export default router;
