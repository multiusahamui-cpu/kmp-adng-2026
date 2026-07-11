
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { orders, orderItems, products, wallets, transactions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const orderSchema = z.object({
  address: z.string().min(5),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })).min(1)
});

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { address, items } = orderSchema.parse(req.body);
    const buyerId = req.user.id;

    const result = await db.transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      // 1. Validate Stock & Calc Total
      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        
        if (!product) throw new Error("Produk tidak ditemukan");
        if ((product.stock || 0) < item.quantity) {
          throw new Error(`Stok produk ${product.name} tidak mencukupi`);
        }
        
        const subTotal = Number(product.price) * item.quantity;
        totalAmount += subTotal;

        // Reduce Stock
        await tx.update(products)
            .set({ stock: (product.stock || 0) - item.quantity })
            .where(eq(products.id, item.productId));

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      }

      // 2. Check Buyer Balance
      const [buyerWallet] = await tx.select().from(wallets).where(eq(wallets.userId, buyerId));
      if (!buyerWallet) throw new Error("Wallet not found");
      
      if (Number(buyerWallet.balance) < totalAmount) {
        throw new Error("Saldo KMP-ADNG Pay tidak mencukupi");
      }

      // 3. Deduct Balance
      const newBalance = (Number(buyerWallet.balance) - totalAmount).toString();
      await tx.update(wallets)
        .set({ balance: newBalance })
        .where(eq(wallets.id, buyerWallet.id));

      // 4. Create Transaction Log
      await tx.insert(transactions).values({
        walletId: buyerWallet.id,
        type: 'PURCHASE',
        amount: totalAmount.toString(),
        description: `Belanja ${items.length} Item`,
        status: 'success'
      });

      // 5. Create Order
      const [newOrder] = await tx.insert(orders).values({
        buyerId,
        totalAmount: totalAmount.toString(),
        address,
        status: 'PROCESSED'
      }).returning();

      // 6. Create Order Items
      for (const oi of orderItemsData) {
          await tx.insert(orderItems).values({
              orderId: newOrder.id,
              productId: oi.productId,
              quantity: oi.quantity,
              price: oi.price
          });
      }

      return newOrder;
    });

    return successResponse(res, result, "Order Berhasil & Terbayar");

  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data Order Invalid", 400, error.errors);
    return errorResponse(res, error.message || "Gagal membuat order", 400);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const myOrders = await db.select().from(orders)
        .where(eq(orders.buyerId, req.user.id))
        .orderBy(desc(orders.createdAt));
        
    return successResponse(res, myOrders, "Data Pesanan");
  } catch (error) {
    return errorResponse(res, "Gagal mengambil data pesanan", 500);
  }
};
