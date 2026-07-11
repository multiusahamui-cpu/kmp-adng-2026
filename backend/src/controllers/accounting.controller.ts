
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { accounts, journalEntries, journalLines } from '../db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';

import { seedCOA } from '../db/seed_coa';

// ... COA ...
export const seedDefaultCOA = async (req: AuthRequest, res: Response) => {
    try {
        await seedCOA();
        return successResponse(res, null, "Default COA Populated");
    } catch (error) {
        console.error("Seed COA error:", error);
        return errorResponse(res, "Gagal populate COA", 500);
    }
};


import { sql } from 'drizzle-orm';

export const getCOA = async (req: AuthRequest, res: Response) => {
    console.log("GET /coa called");
    try {
        // Debug: Check raw count first
        try {
            const rawCount = await db.execute(sql`SELECT count(*) as count FROM accounts`);
            console.log("Raw SQL Count:", rawCount.rows[0]);
        } catch (e) {
            console.error("Raw SQL Count Failed:", e);
        }

        let result = await db.select().from(accounts).orderBy(asc(accounts.code));
        
        // Fallback: If Drizzle returns empty but we suspect data exists
        if (result.length === 0) {
            try {
                const rawCheck = await db.execute(sql`SELECT * FROM accounts ORDER BY code ASC`);
                if (rawCheck.rows.length > 0) {
                    console.log(`Drizzle returned 0, but Raw SQL found ${rawCheck.rows.length} rows. Using Raw data.`);
                    // Map raw rows to match expected shape if needed, but usually it's fine
                    return successResponse(res, rawCheck.rows, "Chart of Accounts");
                }
            } catch (e) {
                console.error("Raw fallback failed:", e);
            }

            console.log("COA empty (Drizzle & Raw), auto-seeding default accounts...");
            await seedCOA();
            result = await db.select().from(accounts).orderBy(asc(accounts.code));
        }

        console.log(`GET /coa found ${result.length} accounts`);
        return successResponse(res, result, "Chart of Accounts");
    } catch (error) {
        console.error("GET /coa error:", error);
        return errorResponse(res, "Gagal mengambil data COA", 500);
    }
};


export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, type } = req.body;
        const [account] = await db.insert(accounts).values({ code, name, type }).returning();
        return successResponse(res, account, "Akun COA Dibuat");
    } catch (error) {
        return errorResponse(res, "Gagal buat akun", 500);
    }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, type } = req.body;
        const [account] = await db.update(accounts)
            .set({ code, name, type })
            .where(eq(accounts.id, id))
            .returning();
        
        if (!account) {
            return errorResponse(res, "Akun tidak ditemukan", 404);
        }
        return successResponse(res, account, "Akun COA Diperbarui");
    } catch (error) {
        return errorResponse(res, "Gagal update akun", 500);
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(accounts).where(eq(accounts.id, id));
        return successResponse(res, null, "Akun COA Dihapus");
    } catch (error) {
        return errorResponse(res, "Gagal hapus akun (Mungkin sudah dipakai di jurnal)", 500);
    }
};

// --- JOURNAL ---
export const getJournals = async (req: AuthRequest, res: Response) => {
    console.log("GET /journal called");
    try {
        const result = await db.query.journalEntries.findMany({
            with: {
                lines: true
            },
            orderBy: [desc(journalEntries.date)]
        });
        console.log(`GET /journal found ${result.length} entries`);
        return successResponse(res, result, "Daftar Jurnal");
    } catch (error) {
        console.error("GET /journal error:", error);
        return errorResponse(res, "Gagal mengambil data jurnal", 500);
    }
};

export const createJournal = async (req: AuthRequest, res: Response) => {
    try {
        const { date, ref, description, lines } = req.body;
        
        // lines: [{ accountId, debit, credit }]
        const totalDebit = lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
        const totalCredit = lines.reduce((sum: number, line: any) => sum + Number(line.credit), 0);

        if (totalDebit !== totalCredit) {
            return errorResponse(res, "Jurnal Tidak Balance", 400);
        }

        const result = await db.transaction(async (tx) => {
            const [journal] = await tx.insert(journalEntries).values({
                date: new Date(date).toISOString(), // ensure ISO format
                ref,
                description,
                total: totalDebit.toString(),
                createdBy: req.user.id
            }).returning();

            for (const line of lines) {
                await tx.insert(journalLines).values({
                    journalId: journal.id,
                    accountId: line.accountId,
                    debit: line.debit.toString(),
                    credit: line.credit.toString()
                });
            }
            return journal;
        });

        return successResponse(res, result, "Jurnal Diposting");
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Gagal posting jurnal", 500);
    }
};

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
    // Basic Mock Balance Sheet for Drizzle (Complex aggregation needs SQL builder)
    // For now returning structure
    return successResponse(res, { Assets: 0, Liabilities: 0, Equity: 0 }, "Laporan Neraca (Simulasi)");
};
