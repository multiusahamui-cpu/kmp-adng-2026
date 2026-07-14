
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { paymentRequests, users, resignationRequests, wallets, transactions } from '../db/schema';
import { eq, ne, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

export const getPaymentRequests = async (req: AuthRequest, res: Response) => {
    // Fetch requests not PAID
    const requests = await db.select({
        id: paymentRequests.id,
        amount: paymentRequests.amount,
        type: paymentRequests.type,
        description: paymentRequests.description,
        status: paymentRequests.status,
        requesterName: users.name
    })
    .from(paymentRequests)
    .leftJoin(users, eq(paymentRequests.requesterId, users.id))
    .where(ne(paymentRequests.status, 'PAID'))
    .orderBy(desc(paymentRequests.createdAt));

    return successResponse(res, requests, "Antrian Pembayaran");
};

export const createPaymentRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { type, amount, description } = req.body;
        const [request] = await db.insert(paymentRequests).values({
            requesterId: req.user.id,
            type,
            amount: amount.toString(),
            description,
            status: 'PENDING'
        }).returning();
        
        return successResponse(res, request, "Permintaan Dana Terkirim");
    } catch (error) {
        return errorResponse(res, "Gagal request dana", 500);
    }
};

export const executePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.body;

        await db.update(paymentRequests)
            .set({ status: 'PAID' })
            .where(eq(paymentRequests.id, requestId));

        return successResponse(res, null, "Pembayaran Dieksekusi");
    } catch (error) {
        return errorResponse(res, "Gagal eksekusi pembayaran", 500);
    }
};

// --- PENCAIRAN TUTUP AHLI WARIS (Cash closure setelah disetujui GM) ---

// Antrian permohonan penutupan akun ahli waris (metode tunai) yang sudah
// disetujui GM, menunggu eksekusi fisik di kasir.
export const getAwaitingCashierResignations = async (req: AuthRequest, res: Response) => {
    const result = await db.select({
        id: resignationRequests.id,
        userId: resignationRequests.userId,
        userName: users.name,
        userPhone: users.phone,
        reason: resignationRequests.reason,
        approvedAt: resignationRequests.approvedAt,
    })
        .from(resignationRequests)
        .innerJoin(users, eq(resignationRequests.userId, users.id))
        .where(eq(resignationRequests.status, 'awaiting_cashier'))
        .orderBy(desc(resignationRequests.approvedAt));

    return successResponse(res, result, "Antrian Pencairan Tutup Ahli Waris");
};

// Kasir eksekusi pencairan tunai: jurnal semua ekuitas + saldo dompet jadi
// nol, tutup akun. Identitas fisik ahli waris (KTP + KK almarhum/almarhumah)
// diverifikasi Kasir secara offline sebelum klik ini -- bukan sesuatu yang
// direpresentasikan di sistem. Proteksi sebenarnya: endpoint ini digerbangi
// role 'cashier' + status permohonan harus 'awaiting_cashier'.
export const executeHeirClosure = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const [request] = await db.select().from(resignationRequests).where(eq(resignationRequests.id, id));
        if (!request) return errorResponse(res, "Permohonan tidak ditemukan", 404);
        if (request.status !== 'awaiting_cashier') {
            return errorResponse(res, "Permohonan ini tidak dalam status menunggu eksekusi Kasir.", 400);
        }

        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, request.userId));
        if (!wallet) return errorResponse(res, "Wallet anggota tidak ditemukan", 404);

        const totalPayout = Number(wallet.balance) + Number(wallet.savings);

        await db.transaction(async (tx) => {
            await tx.insert(transactions).values({
                walletId: wallet.id,
                type: 'EQUITY_CLOSURE_CASH',
                amount: totalPayout.toString(),
                description: `Pencairan tunai penutupan akun (ahli waris) - Permohonan #${id}`,
                status: 'success',
                referenceId: `CLOSURE-${id}`,
            });

            await tx.update(wallets)
                .set({ balance: '0', savings: '0', savingsPokok: '0', savingsWajib: '0', savingsSukarela: '0' })
                .where(eq(wallets.id, wallet.id));

            await tx.update(resignationRequests)
                .set({ status: 'closed', closedAt: new Date(), closedBy: req.user.id })
                .where(eq(resignationRequests.id, id));

            await tx.update(users)
                .set({ status: 'closed' })
                .where(eq(users.id, request.userId));
        });

        return successResponse(res, { totalPayout }, `Akun ditutup. Total tunai diserahkan: Rp ${totalPayout.toLocaleString('id-ID')}`);
    } catch (error: any) {
        return errorResponse(res, "Gagal eksekusi pencairan", 500);
    }
};
