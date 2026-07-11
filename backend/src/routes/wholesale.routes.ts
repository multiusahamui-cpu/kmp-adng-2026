
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getItems, createItem, placeBid, acceptBid } from '../controllers/wholesale.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/items', getItems as RequestHandler);
router.post('/items', createItem as RequestHandler);
router.post('/:id/bid', placeBid as RequestHandler);
router.put('/bid/:bidId/accept', acceptBid as RequestHandler);

export default router;
