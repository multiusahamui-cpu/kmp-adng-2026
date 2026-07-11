import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProducts, createProduct, deleteProduct } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);
router.post('/', authenticate, createProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
