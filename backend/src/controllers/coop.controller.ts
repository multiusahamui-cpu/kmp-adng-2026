
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { wallets, loans, coopStats } from '../db/schema';
import { eq, inArray, and, desc, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

export const getCoopStats = async (req: AuthRequest, res: Response) => {
    try {
        // Try to get cached stats
        const [stats] = await db.select().from(coopStats).orderBy(desc(coopStats.lastUpdated)).limit(1);

        if (stats) {
             return successResponse(res, stats, "Statistik Koperasi");
        }

        // If no stats, calculate from wallets (initial seed)
        const [totals] = await db.select({
            pokok: sql<number>`sum(cast(${wallets.savingsPokok} as numeric))`,
            wajib: sql<number>`sum(cast(${wallets.savingsWajib} as numeric))`,
            sukarela: sql<number>`sum(cast(${wallets.savingsSukarela} as numeric))`
        }).from(wallets);

        // Create initial stats entry
        const [newStats] = await db.insert(coopStats).values({
            totalSimpananPokok: totals.pokok?.toString() || '0',
            totalSimpananWajib: totals.wajib?.toString() || '0',
            totalSimpananSukarela: totals.sukarela?.toString() || '0',
            cadanganModal: '5000000000', // Mock initial value
            hibah: '2000000000', // Mock initial value
            shuDitahan: '3000000000' // Mock initial value
        }).returning();

        return successResponse(res, newStats, "Statistik Koperasi (Generated)");
    } catch (error) {
        console.error("Error fetching coop stats:", error);
        return errorResponse(res, "Gagal mengambil statistik koperasi", 500);
    }
};

export const getShuInfo = async (req: AuthRequest, res: Response) => {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, req.user.id));
    const modal = Number(wallet?.savings || 0);
    
    const estimatedShu = (modal * 0.05) + 50000;

    return successResponse(res, { 
        year: new Date().getFullYear(),
        estimatedAmount: estimatedShu 
    }, "Estimasi SHU");
};

export const simulateLoan = async (req: any, res: Response) => {
    const { amount, duration } = req.body; 
    const interestRate = 0.015; 
    
    const principal = amount / duration;
    const interest = amount * interestRate;
    const monthlyPayment = principal + interest;
    
    return successResponse(res, {
        amount,
        duration,
        monthlyPayment,
        totalRepayment: monthlyPayment * duration
    }, "Simulasi Pinjaman");
};

export const applyLoan = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, duration, purpose } = req.body;
        
        const [loan] = await db.insert(loans).values({
            userId: req.user.id,
            amount: amount.toString(),
            duration,
            interestRate: '1.5',
            status: 'pending',
            reason: purpose
        }).returning();
        
        return successResponse(res, loan, "Pengajuan Pinjaman Diterima");
    } catch (error) {
        return errorResponse(res, "Gagal mengajukan pinjaman", 500);
    }
};

export const getActiveLoans = async (req: AuthRequest, res: Response) => {
    const activeLoans = await db.select().from(loans)
        .where(
            // @ts-ignore
            and(
                eq(loans.userId, req.user.id),
                inArray(loans.status, ['active', 'pending'])
            )
        );
    return successResponse(res, activeLoans, "Pinjaman Aktif");
};
