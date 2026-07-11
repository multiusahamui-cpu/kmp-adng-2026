
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { paymentRequests, users } from '../db/schema';
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
