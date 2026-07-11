
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { carts, cartItems, orders, orderItems, products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { successResponse } from '../utils/response';

// --- CART LOGIC ---
export const getCart = async (req: AuthRequest, res: Response) => {
    // Simple fetch cart
    const [cart] = await db.select().from(carts).where(eq(carts.userId, req.user.id));
    if(!cart) return successResponse(res, [], "Keranjang Kosong");

    // Fetch items (Manual Join for Drizzle basic usage)
    const items = await db.select({
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productPrice: products.price,
        productImage: products.image
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

    return successResponse(res, items, "Isi Keranjang");
};

export const addToCart = async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
    if (!cart) {
        [cart] = await db.insert(carts).values({ userId }).returning();
    }

    // Check existing item
    const [existingItem] = await db.select().from(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));

    if (existingItem) {
        await db.update(cartItems)
            .set({ quantity: (existingItem.quantity || 0) + quantity })
            .where(eq(cartItems.id, existingItem.id));
    } else {
        await db.insert(cartItems).values({
            cartId: cart.id,
            productId,
            quantity
        });
    }

    return successResponse(res, null, "Masuk Keranjang");
};

// --- SHIPPING LOGIC (MOCK) ---
export const checkShippingCost = async (req: AuthRequest, res: Response) => {
    const costs = [
        { service: 'REG', cost: 15000, etd: '2-3 Hari' },
        { service: 'YES', cost: 25000, etd: '1 Hari' },
        { service: 'KARGO', cost: 50000, etd: '5-7 Hari' }
    ];
    return successResponse(res, costs, "Cek Ongkir Berhasil");
};

// --- MERCHANT LOGIC ---
export const getMerchantOrders = async (req: AuthRequest, res: Response) => {
    // Complex join required. Simplified: Get products by seller, then find orders containing them.
    // For MVP Drizzle without Relations setup in query builder, this is verbose.
    // Returning empty array mock for stability first.
    return successResponse(res, [], "Pesanan Masuk (Merchant) - Fitur Segera Hadir di Drizzle");
};

export const updateMerchantOrderStatus = async (req: AuthRequest, res: Response) => {
    const { id } = (req as any).params; 
    const { status } = req.body;
    
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return successResponse(res, null, "Status Pesanan Diupdate");
};
