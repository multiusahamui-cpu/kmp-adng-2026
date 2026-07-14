import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { purchasePPOB, getPPOBServices } from '../controllers/ppob.controller';

const router = Router();

router.use(authenticate as RequestHandler);

// GET /api/v1/ppob/services -> Ambil daftar harga
router.get('/services', getPPOBServices as RequestHandler);

// POST /api/v1/ppob/purchase -> Eksekusi beli
router.post('/purchase', purchasePPOB as RequestHandler);

export default router;
