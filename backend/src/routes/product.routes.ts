import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProducts, createProduct, deleteProduct } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts as RequestHandler);
router.post('/', authenticate as RequestHandler, createProduct as RequestHandler);
router.delete('/:id', authenticate as RequestHandler, deleteProduct as RequestHandler);

export default router;
