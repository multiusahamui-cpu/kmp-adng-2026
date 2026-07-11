
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { wallets, transactions, users, kordinatorDetails } from '../db/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';
import { generateKtaNumber } from '../utils/kta';

const topupSchema = z.object({
  amount: z.number().min(10000, "Minimal topup Rp 10.000"),
});

const transferSchema = z.object({
  amount: z.number().min(1000, "Minimal transfer Rp 1.000"),
  targetPhone: z.string().min(10, "Nomor HP tujuan tidak valid"),
  description: z.string().optional(),
});

export const getWalletInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get Wallet
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (!wallet) return errorResponse(res, "Wallet not found", 404);

    // Get History (Include Pending Bills)
    const history = await db.select()
        .from(transactions)
        .where(eq(transactions.walletId, wallet.id))
        .orderBy(desc(transactions.createdAt))
        .limit(20);

    // Map to frontend structure with savingsDetail
    const walletData = {
        ...wallet,
        savingsDetail: {
            pokok: Number(wallet.savingsPokok),
            wajib: Number(wallet.savingsWajib),
            sukarela: Number(wallet.savingsSukarela),
            total: Number(wallet.savings)
        },
        transactions: history
    };

    return successResponse(res, walletData, "Data Wallet Berhasil Diambil");
  } catch (error) {
    return errorResponse(res, "Terjadi kesalahan server", 500);
  }
};

export const topupBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = topupSchema.parse(req.body);
    const userId = req.user.id;

    const result = await db.transaction(async (tx) => {
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (!wallet) throw new Error("Wallet not found");

      // Update Balance (Amount string because decimal)
      const newBalance = (Number(wallet.balance) + amount).toString();
      
      const [updatedWallet] = await tx.update(wallets)
        .set({ balance: newBalance })
        .where(eq(wallets.id, wallet.id))
        .returning();

      await tx.insert(transactions).values({
        walletId: wallet.id,
        type: 'TOPUP',
        amount: amount.toString(),
        description: 'Topup Saldo via Bank Transfer',
        status: 'success'
      });

      return updatedWallet;
    });

    return successResponse(res, result, "Topup Berhasil");
  } catch (error: any) {
    return errorResponse(res, error.message || "Topup Gagal", 400);
  }
};

export const transferBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, targetPhone, description } = transferSchema.parse(req.body);
    const senderId = req.user.id;

    if (amount <= 0) return errorResponse(res, "Nominal tidak valid", 400);

    const result = await db.transaction(async (tx) => {
      // 1. Get Sender Wallet
      const [senderWallet] = await tx.select().from(wallets).where(eq(wallets.userId, senderId));
      if (!senderWallet) throw new Error("Sender wallet not found");
      
      if (Number(senderWallet.balance) < amount) {
        throw new Error("Saldo tidak mencukupi");
      }

      // 2. Get Receiver
      const [receiverUser] = await tx.select().from(users).where(eq(users.phone, targetPhone));
      if (!receiverUser) throw new Error("Nomor HP tujuan tidak ditemukan");
      if (receiverUser.id === senderId) throw new Error("Tidak bisa transfer ke diri sendiri");

      const [receiverWallet] = await tx.select().from(wallets).where(eq(wallets.userId, receiverUser.id));
      if (!receiverWallet) throw new Error("Receiver wallet not found");

      // 3. Update Balances
      const newSenderBalance = (Number(senderWallet.balance) - amount).toString();
      const newReceiverBalance = (Number(receiverWallet.balance) + amount).toString();

      await tx.update(wallets).set({ balance: newSenderBalance }).where(eq(wallets.id, senderWallet.id));
      await tx.update(wallets).set({ balance: newReceiverBalance }).where(eq(wallets.id, receiverWallet.id));

      // 4. Create Transactions (Sender Log)
      await tx.insert(transactions).values({
          walletId: senderWallet.id,
          type: 'TRANSFER_OUT',
          amount: amount.toString(),
          description: description || `Transfer ke ${receiverUser.name}`,
          referenceId: receiverUser.id,
          status: 'success'
      });

      // 5. Receiver Log
      await tx.insert(transactions).values({
          walletId: receiverWallet.id,
          type: 'TRANSFER_IN',
          amount: amount.toString(),
          description: description || `Terima dari Pengirim`,
          referenceId: senderId,
          status: 'success'
      });

      return { balance: newSenderBalance };
    });

    return successResponse(res, result, "Transfer Berhasil");

  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, error.message || "Transfer Gagal", 400);
  }
};

/**
 * Pay Bill (Tagihan Onboarding)
 * Dipanggil saat user klik bayar pada tagihan pending (Pendaftaran / Simpanan Pokok)
 */
export const payBill = async (req: AuthRequest, res: Response) => {
    try {
        const { transactionId } = req.body;
        const userId = req.user.id;

        const result = await db.transaction(async (tx) => {
            // 1. Get Wallet
            const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
            if (!wallet) throw new Error("Dompet tidak ditemukan");

            // 2. Get Transaction
            const [bill] = await tx.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.walletId, wallet.id)));
            
            if (!bill) throw new Error("Tagihan tidak ditemukan");
            if (bill.status === 'success') throw new Error("Tagihan sudah dibayar");
            
            // Konversi Decimal ke Number untuk kalkulasi
            const amount = Number(bill.amount);

            // 3. Cek Saldo
            if (Number(wallet.balance) < amount) {
                throw new Error("Saldo tidak mencukupi. Silahkan Top Up dulu.");
            }

            // 4. Potong Saldo & Update Transaksi
            const newBalance = (Number(wallet.balance) - amount).toString();
            
            // Jika ini simpanan pokok, tambah ke field savings
            let newSavings = Number(wallet.savings);
            let newSavingsPokok = Number(wallet.savingsPokok);
            let newSavingsWajib = Number(wallet.savingsWajib);
            let newSavingsSukarela = Number(wallet.savingsSukarela);

            if (bill.type === 'BILL_PRINCIPAL') {
                newSavings += amount;
                newSavingsPokok += amount;
            } else if (bill.type === 'BILL_MANDATORY') {
                newSavings += amount;
                newSavingsWajib += amount;
            } else if (bill.type === 'BILL_VOLUNTARY') {
                newSavings += amount;
                newSavingsSukarela += amount;
            }

            await tx.update(wallets)
                .set({ 
                    balance: newBalance, 
                    savings: newSavings.toString(),
                    savingsPokok: newSavingsPokok.toString(),
                    savingsWajib: newSavingsWajib.toString(),
                    savingsSukarela: newSavingsSukarela.toString()
                })
                .where(eq(wallets.id, wallet.id));

            // CRITICAL FIX: Gunakan new Date() (Objek), bukan string. 
            // Drizzle/PG driver akan mengurus konversinya. 
            // Jangan gunakan .toISOString() di sini.
            await tx.update(transactions)
                .set({ status: 'success', date: new Date() }) 
                .where(eq(transactions.id, bill.id));

            // 5. CEK APAKAH SEMUA TAGIHAN ONBOARDING SUDAH LUNAS
            // Cari transaksi pending lain dengan tipe onboarding
            const remainingBills = await tx.select().from(transactions).where(and(
                eq(transactions.walletId, wallet.id),
                eq(transactions.status, 'pending'),
                // Filter manual nanti di bawah karena Drizzle raw filter kadang tricky
            ));
            
            const onboardingBills = remainingBills.filter(t => t.type === 'BILL_REGISTRATION' || t.type === 'BILL_PRINCIPAL');

            let activated = false;
            let kta = null;

            if (onboardingBills.length === 0) {
                // SEMUA LUNAS -> AKTIVASI AKUN & GENERATE KTA
                const [user] = await tx.select().from(users).where(eq(users.id, userId));
                
                if (user.status !== 'active') {
                    // Generate KTA
                    // Gunakan cityId user. Pastikan user.cityId berisi KODE lokasi (misal "32.04")
                    const cityCode = user.cityId || '00.00'; 
                    const newKtaNumber = await generateKtaNumber(userId, cityCode);

                    await tx.update(users).set({ 
                        status: 'active',
                        ktaId: newKtaNumber
                    }).where(eq(users.id, userId));
                    
                    // Increment Kordinator counters
                    const locationCodes = [
                        user.regional,
                        user.provinceId,
                        user.cityId,
                        user.districtId,
                        user.villageId
                    ].filter(Boolean) as string[];

                    if (locationCodes.length > 0) {
                        await tx.update(kordinatorDetails)
                            .set({ memberCounter: sql`${kordinatorDetails.memberCounter} + 1` })
                            .where(and(
                                inArray(kordinatorDetails.locationCode, locationCodes),
                                eq(kordinatorDetails.status, 'active')
                            ));
                    }
                    
                    activated = true;
                    kta = newKtaNumber;
                }
            }

            return { activated, kta, balance: newBalance };
        });

        if (result.activated) {
            return successResponse(res, result, "Pembayaran Berhasil! Selamat, Keanggotaan KMP-ADNG Anda kini AKTIF.");
        } else {
            return successResponse(res, result, "Pembayaran Berhasil. Selesaikan tagihan lainnya untuk aktivasi.");
        }

    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal Membayar Tagihan", 400);
    }
};

export const withdrawVoluntarySavings = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, pin } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return errorResponse(res, "Jumlah penarikan tidak valid", 400);
        }

        const result = await db.transaction(async (tx) => {
            // 1. Get User & Wallet
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            if (!user) throw new Error("User tidak ditemukan");

            // Validate PIN (Simple check for now)
            if (user.pin && user.pin !== pin) {
                 throw new Error("PIN Salah");
            }

            const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
            if (!wallet) throw new Error("Dompet tidak ditemukan");

            // 2. Check Voluntary Savings Balance
            const currentVoluntary = Number(wallet.savingsSukarela);
            if (currentVoluntary < amount) {
                throw new Error("Saldo Simpanan Sukarela tidak mencukupi");
            }

            // 3. Update Wallet (Deduct Voluntary, Add to Main Balance)
            // Note: Total Savings also decreases because Voluntary is part of Total Savings
            const newVoluntary = currentVoluntary - amount;
            const newTotalSavings = Number(wallet.savings) - amount;
            const newBalance = Number(wallet.balance) + amount;

            await tx.update(wallets)
                .set({
                    savingsSukarela: newVoluntary.toString(),
                    savings: newTotalSavings.toString(),
                    balance: newBalance.toString(),
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id));

            // 4. Log Transaction
            await tx.insert(transactions).values({
                walletId: wallet.id,
                type: 'SAVING_WITHDRAW',
                amount: amount.toString(),
                description: 'Penarikan Simpanan Sukarela ke Saldo Utama',
                status: 'success',
                date: new Date()
            });

            return { 
                balance: newBalance, 
                savingsSukarela: newVoluntary 
            };
        });

        return successResponse(res, result, "Penarikan Berhasil");

    } catch (error: any) {
        return errorResponse(res, error.message || "Penarikan Gagal", 400);
    }
};
