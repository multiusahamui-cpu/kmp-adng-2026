
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyPin } from '../middleware/pin.middleware';
import { getCart, addToCart, checkShippingCost, getMerchantOrders, updateMerchantOrderStatus } from '../controllers/marketplace.controller';
import { getProducts, createProduct } from '../controllers/product.controller';
import { createOrder, getMyOrders } from '../controllers/order.controller';

const router = Router();

// Public Product List
router.get('/products', getProducts);

// Protected Routes
router.use(authenticate);

// Cart
router.get('/cart', getCart);
router.post('/cart', addToCart);

// Checkout & Orders
// Wajib pakai PIN sekarang
router.post('/checkout', verifyPin, createOrder); 
router.get('/orders', getMyOrders); // Fetch Buyer History
router.post('/shipping/cost', checkShippingCost);

// Merchant Side
router.post('/products', createProduct);
router.get('/merchant/orders', getMerchantOrders);
router.put('/merchant/orders/:id/status', updateMerchantOrderStatus);

export default router;
