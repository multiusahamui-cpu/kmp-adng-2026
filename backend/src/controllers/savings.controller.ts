
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { wallets, transactions } from '../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

const savingsSchema = z.object({
  amount: z.number().min(10000, "Minimal transaksi Rp 10.000"),
  type: z.enum(['POKOK', 'WAJIB', 'SUKARELA']),
});

export const getSavingsInfo = async (req: AuthRequest, res: Response) => {
  try {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, req.user.id));
    
    // Get History
    // Note: Drizzle raw query or where condition needs proper setup for 'in' check with enums or strings
    const history = await db.select().from(transactions)
        .where(and(
            eq(transactions.walletId, wallet?.id || ''),
            inArray(transactions.type, ['SAVING_DEPOSIT', 'SAVING_WITHDRAW'])
        ))
        .orderBy(desc(transactions.createdAt))
        .limit(10);

    return successResponse(res, { 
      totalSavings: wallet?.savings || 0,
      activeBalance: wallet?.balance || 0,
      history 
    }, "Info Simpanan");
  } catch (error) {
    return errorResponse(res, "Gagal mengambil data simpanan", 500);
  }
};

export const depositSavings = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, type } = savingsSchema.parse(req.body);
    const userId = req.user.id;

    const result = await db.transaction(async (tx) => {
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (!wallet) throw new Error("Wallet not found");
      
      if (Number(wallet.balance) < amount) {
        throw new Error("Saldo Dompet Utama tidak mencukupi.");
      }

      // Update
      const newBalance = (Number(wallet.balance) - amount).toString();
      const newSavings = (Number(wallet.savings) + amount).toString();

      const [updatedWallet] = await tx.update(wallets)
        .set({ balance: newBalance, savings: newSavings })
        .where(eq(wallets.id, wallet.id))
        .returning();

      await tx.insert(transactions).values({
        walletId: wallet.id,
        type: 'SAVING_DEPOSIT',
        amount: amount.toString(),
        description: `Setoran Simpanan ${type}`,
        status: 'success'
      });

      return updatedWallet;
    });

    return successResponse(res, result, "Setoran Simpanan Berhasil");
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, error.message || "Gagal setor simpanan", 400);
  }
};

export const withdrawSavings = async (req: AuthRequest, res: Response) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 10000) return errorResponse(res, "Minimal penarikan Rp 10.000", 400);

        const result = await db.transaction(async (tx) => {
            const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
            if (!wallet) throw new Error("Wallet not found");

            if (Number(wallet.savings) < amount) {
                throw new Error("Saldo Simpanan tidak mencukupi.");
            }

            const newBalance = (Number(wallet.balance) + amount).toString();
            const newSavings = (Number(wallet.savings) - amount).toString();

            const [updatedWallet] = await tx.update(wallets)
                .set({ balance: newBalance, savings: newSavings })
                .where(eq(wallets.id, wallet.id))
                .returning();

            await tx.insert(transactions).values({
                walletId: wallet.id,
                type: 'SAVING_WITHDRAW',
                amount: amount.toString(),
                description: `Penarikan Simpanan ke Dompet`,
                status: 'success'
            });

            return updatedWallet;
        });

        return successResponse(res, result, "Penarikan Simpanan Berhasil");
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal tarik simpanan", 400);
    }
};
