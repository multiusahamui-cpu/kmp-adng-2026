
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getActiveVotes, castVote, createTicket } from '../controllers/community.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/votes', getActiveVotes as RequestHandler);
router.post('/votes/:sessionId/cast', castVote as RequestHandler);
router.post('/tickets', createTicket as RequestHandler);

export default router;
