
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { wallets, transactions, ppobProducts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const ppobSchema = z.object({
  productCode: z.string(), // e.g., PULSA5
  customerNumber: z.string().min(8, "Nomor pelanggan tidak valid"),
});

export const purchasePPOB = async (req: AuthRequest, res: Response) => {
  try {
    const { productCode, customerNumber } = ppobSchema.parse(req.body);
    const userId = req.user.id;

    // 1. Fetch Product from DB
    const [product] = await db.select().from(ppobProducts).where(eq(ppobProducts.code, productCode));
    
    if (!product) return errorResponse(res, "Produk PPOB tidak ditemukan", 404);
    if (product.status !== 'active') return errorResponse(res, "Produk sedang gangguan", 400);

    const price = Number(product.price);

    const result = await db.transaction(async (tx) => {
      // 2. Check Balance
      const [userWallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (!userWallet) throw new Error("Dompet tidak ditemukan");
      
      if (Number(userWallet.balance) < price) {
        throw new Error("Saldo KMP-ADNG Pay tidak mencukupi.");
      }

      // 3. Deduct Balance
      const newBalance = (Number(userWallet.balance) - price).toString();
      await tx.update(wallets)
        .set({ balance: newBalance })
        .where(eq(wallets.id, userWallet.id));

      // 4. Record Transaction
      const refId = `PPOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [newTx] = await tx.insert(transactions).values({
          walletId: userWallet.id,
          type: 'PPOB',
          amount: price.toString(),
          description: `Beli ${product.name} ke ${customerNumber}`,
          referenceId: refId,
          status: 'success'
      }).returning();

      return newTx;
    });

    return successResponse(res, result, `Transaksi Berhasil! ${product.name} sedang diproses.`);

  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data Transaksi Invalid", 400, error.errors);
    return errorResponse(res, error.message || "Transaksi Gagal", 400);
  }
};

export const getPPOBServices = async (req: AuthRequest, res: Response) => {
    try {
        const products = await db.select().from(ppobProducts).where(eq(ppobProducts.status, 'active'));
        
        // Group by category for frontend convenience
        const grouped = products.reduce((acc: any, curr) => {
            const cat = curr.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
                id: curr.id,
                code: curr.code,
                label: curr.name,
                price: Number(curr.price),
                desc: curr.description
            });
            return acc;
        }, {});

        return successResponse(res, grouped, "Daftar Layanan PPOB");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data PPOB", 500);
    }
};
