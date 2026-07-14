
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyPin } from '../middleware/pin.middleware';
import { getCart, addToCart, checkShippingCost, getMerchantOrders, updateMerchantOrderStatus } from '../controllers/marketplace.controller';
import { getProducts, createProduct } from '../controllers/product.controller';
import { createOrder, getMyOrders } from '../controllers/order.controller';

const router = Router();

// Public Product List
router.get('/products', getProducts as RequestHandler);

// Protected Routes
router.use(authenticate as RequestHandler);

// Cart
router.get('/cart', getCart as RequestHandler);
router.post('/cart', addToCart as RequestHandler);

// Checkout & Orders
// Wajib pakai PIN sekarang
router.post('/checkout', verifyPin as RequestHandler, createOrder as RequestHandler);
router.get('/orders', getMyOrders as RequestHandler); // Fetch Buyer History
router.post('/shipping/cost', checkShippingCost as RequestHandler);

// Merchant Side
router.post('/products', createProduct as RequestHandler);
router.get('/merchant/orders', getMerchantOrders as RequestHandler);
router.put('/merchant/orders/:id/status', updateMerchantOrderStatus as RequestHandler);

export default router;
