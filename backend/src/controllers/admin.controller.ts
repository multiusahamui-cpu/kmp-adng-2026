
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { users, regions, systemConfig, roleApplications, wallets, transactions, locations, kordinatorDetails, resignationRequests } from '../db/schema';
import { eq, or, like, desc, and, sql, inArray, getTableColumns } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import { z } from 'zod';

// --- EOD SETTLEMENT ---
export const runEodSettlement = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Find all users who became active and have a referredBy code, but haven't been settled
        const unsettledReferrals = await db.select().from(users)
            .where(and(
                eq(users.status, 'active'),
                sql`${users.referredBy} IS NOT NULL`,
                eq(users.referralSettled, false)
            ));

        if (unsettledReferrals.length === 0) {
            return successResponse(res, null, "Tidak ada data referral yang perlu di-settlement hari ini.");
        }

        // 2. Group by referredBy (referral code)
        const referralCounts: Record<string, number> = {};
        for (const user of unsettledReferrals) {
            const code = user.referredBy as string;
            referralCounts[code] = (referralCounts[code] || 0) + 1;
        }

        const BONUS_PER_REFERRAL = 30000; // Rp 30.000 per referral
        let totalSettled = 0;

        await db.transaction(async (tx) => {
            for (const [referralCode, count] of Object.entries(referralCounts)) {
                // Find the referrer
                const [referrer] = await tx.select().from(users).where(eq(users.referralCode, referralCode));
                if (!referrer) continue; // If referrer not found, skip

                // Find referrer's wallet
                const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, referrer.id));
                if (!wallet) continue;

                const totalBonus = count * BONUS_PER_REFERRAL;

                // Update wallet balance
                await tx.update(wallets)
                    .set({ balance: sql`${wallets.balance} + ${totalBonus}` })
                    .where(eq(wallets.id, wallet.id));

                // Create transaction record
                await tx.insert(transactions).values({
                    walletId: wallet.id,
                    type: 'BONUS_REFERRAL',
                    amount: totalBonus.toString(),
                    description: `Pendapatan Referral EOD (${count} anggota baru)`,
                    status: 'success',
                    referenceId: `EOD-REF-${Date.now()}-${referrer.id}`
                });

                totalSettled += count;
            }

            // Mark all processed referrals as settled
            const userIds = unsettledReferrals.map(u => u.id);
            if (userIds.length > 0) {
                await tx.update(users)
                    .set({ referralSettled: true })
                    .where(inArray(users.id, userIds));
            }
        });

        return successResponse(res, { totalSettled }, `Proses EOD Settlement selesai. Total ${totalSettled} referral dibayarkan.`);
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal menjalankan EOD Settlement", 500);
    }
};

// --- APPROVALS (User Role Applications) ---

export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
    try {
        // Fetch from role_applications table where status is pending
        // Join with users to get name/email
        const result = await db.select({
            id: roleApplications.id,
            userId: roleApplications.userId,
            userName: users.name,
            userEmail: users.email,
            role: roleApplications.role,
            data: roleApplications.data,
            status: roleApplications.status,
            createdAt: roleApplications.createdAt
        })
        .from(roleApplications)
        .innerJoin(users, eq(roleApplications.userId, users.id))
        .where(eq(roleApplications.status, 'pending'))
        .orderBy(desc(roleApplications.createdAt));

        return successResponse(res, result, "Daftar Approval Pending");
    } catch (error) {
        return errorResponse(res, "Gagal mengambil data approval", 500);
    }
};

export const approveRoleApplication = async (req: any, res: Response) => {
    try {
        const { id } = req.params; // Application ID
        const { action, adminNotes } = req.body; // 'approve' or 'reject'
        
        const [application] = await db.select().from(roleApplications).where(eq(roleApplications.id, id));
        if(!application) return errorResponse(res, "Aplikasi tidak ditemukan", 404);

        if (application.status !== 'pending') return errorResponse(res, "Aplikasi sudah diproses sebelumnya", 400);

        if (action === 'reject') {
            await db.update(roleApplications)
                .set({ status: 'rejected', adminNotes })
                .where(eq(roleApplications.id, id));
            return successResponse(res, null, "Pengajuan Ditolak");
        }

        if (action === 'approve') {
            // TRANSACTION: Update App Status -> Add User Role -> Save User Details
            await db.transaction(async (tx) => {
                // 1. Update App Status
                await tx.update(roleApplications)
                    .set({ status: 'approved', adminNotes })
                    .where(eq(roleApplications.id, id));

                // 2. Fetch User to get current roles
                const [user] = await tx.select().from(users).where(eq(users.id, application.userId));
                if (!user) throw new Error("User not found");

                const currentRoles = user.roles || [];
                if (!currentRoles.includes(application.role)) {
                    currentRoles.push(application.role);
                }

                // 3. Determine which details column to update based on role
                const updateData: any = { roles: currentRoles };
                const roleData = application.data as any;

                switch(application.role) {
                    case 'merchant': updateData.shopDetails = roleData; break;
                    case 'driver': updateData.driverDetails = roleData; break;
                    case 'exchanger': updateData.exchangerDetails = roleData; break;
                    case 'content_creator': updateData.contentCreatorDetails = roleData; break;
                    case 'distributor': updateData.distributorDetails = roleData; break;
                    case 'mobile_trader': updateData.mobileTraderDetails = roleData; break;
                    case 'marketing_coordinator': updateData.marketingRoleDetails = roleData; break;
                    // producer logic might need specific table, but here we can dump to generic or define a col if needed
                    // For now, let's assume it implies wholesale access
                }

                // 4. Execute Update
                await tx.update(users)
                    .set(updateData)
                    .where(eq(users.id, application.userId));

                // 5. Special logic for marketing_coordinator
                if (application.role === 'marketing_coordinator' && roleData?.coordinatorData) {
                    const { level, areaCode } = roleData.coordinatorData;
                    
                    if (areaCode) {
                        // Update locations table
                        await tx.update(locations)
                            .set({ coordinatorId: application.userId })
                            .where(eq(locations.code, areaCode));
                        
                        // Insert into kordinatorDetails
                        await tx.insert(kordinatorDetails).values({
                            userId: application.userId,
                            level: level,
                            locationCode: areaCode,
                            status: 'active'
                        });
                    }
                }
            });

            return successResponse(res, null, `Role ${application.role} berhasil disetujui & aktif.`);
        }

        return errorResponse(res, "Action invalid", 400);

    } catch (error: any) {
        console.error(error);
        return errorResponse(res, "Gagal memproses approval", 500);
    }
};

// --- LEGACY APPROVAL (Keep for backward compatibility if needed, otherwise deprecate) ---
export const approveRole = async (req: any, res: Response) => {
    // Legacy direct injection, better use approveRoleApplication
    return approveRoleApplication(req, res);
};

// --- USER MANAGEMENT ---
// password & pin (bcrypt hash) sengaja dikecualikan -- admin tidak pernah
// butuh hash-nya untuk fitur apapun, dan getTableColumns membuat exclude ini
// otomatis ikut kalau nanti ada kolom sensitif baru ditambahkan ke schema.
const { password: _password, pin: _pin, ...safeUserColumns } = getTableColumns(users);

export const getAllUsers = async (req: any, res: Response) => {
    const { search } = req.query;
    let query = db.select(safeUserColumns).from(users);

    if (search) {
        const searchPattern = `%${search}%`;
        // @ts-ignore
        query = query.where(or(like(users.name, searchPattern), like(users.email, searchPattern)));
    }

    const result = await query.limit(50);
    return successResponse(res, result, "Data Anggota");
};

// --- MASTER DATA (REGIONS) ---
export const createRegion = async (req: AuthRequest, res: Response) => {
    try {
        const { code, name } = req.body;
        const [region] = await db.insert(regions).values({ code, name }).returning();
        return successResponse(res, region, "Wilayah dibuat");
    } catch (error) {
        return errorResponse(res, "Gagal buat wilayah", 500);
    }
};

export const getRegions = async (req: AuthRequest, res: Response) => {
    // Drizzle doesn't auto-fetch deep relations like Prisma include.
    // Needs query builder logic or separate fetches. For simple list:
    const result = await db.select().from(regions);
    return successResponse(res, result, "Data Wilayah");
};

// --- SYSTEM CONFIG ---
export const getConfig = async (req: AuthRequest, res: Response) => {
    try {
        const [config] = await db.select().from(systemConfig).where(eq(systemConfig.id, 'default'));
        return successResponse(res, config, "System Config");
    } catch (error) {
        return errorResponse(res, "Gagal ambil config", 500);
    }
};

export const updateConfig = async (req: AuthRequest, res: Response) => {
    try {
        // Destructure all config parts from body
        const { taxConfig, features, rideConfig, generalConfig } = req.body;
        
        // Upsert logic for config with ID 'default'
        const [config] = await db.insert(systemConfig)
            .values({ id: 'default', taxConfig, features, rideConfig, generalConfig })
            .onConflictDoUpdate({
                target: systemConfig.id,
                set: { taxConfig, features, rideConfig, generalConfig }
            })
            .returning();

        return successResponse(res, config, "Konfigurasi Sistem Diupdate");
    } catch (error) {
        return errorResponse(res, "Gagal update config", 500);
    }
};

// --- RESIGNATION / ACCOUNT CLOSURE (Ahli Waris & Self-Resign) ---

const heirResignationSchema = z.object({
  userId: z.string().uuid("User ID tidak valid"),
  reason: z.string().min(1, "Alasan wajib diisi"),
  description: z.string().optional(),
  disbursementMethod: z.enum(['bank_transfer', 'cash_pickup']),
});

// Dibuat Admin atas nama anggota yang meninggal, berdasarkan email dari ahli
// waris tercatat di sistem (email itu sendiri diproses manual di luar sistem --
// endpoint ini cuma titik masuk setelah Admin memverifikasi email tersebut).
export const createHeirResignation = async (req: AuthRequest, res: Response) => {
  try {
    const data = heirResignationSchema.parse(req.body);

    const [targetUser] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, data.userId));
    if (!targetUser) return errorResponse(res, "Anggota tidak ditemukan", 404);
    if (targetUser.status === 'closed') return errorResponse(res, "Akun anggota ini sudah ditutup", 400);

    const [existing] = await db.select().from(resignationRequests)
      .where(and(eq(resignationRequests.userId, data.userId), eq(resignationRequests.status, 'pending')))
      .limit(1);
    if (existing) return errorResponse(res, "Anggota ini sudah punya permohonan berhenti yang sedang diproses.", 400);

    const [request] = await db.insert(resignationRequests).values({
      userId: data.userId,
      reason: data.reason,
      description: data.description,
      status: 'pending',
      caseType: 'heir_death',
      disbursementMethod: data.disbursementMethod,
      adminNotes: `Diajukan oleh Admin (${req.user.name || req.user.id}) atas nama ahli waris via email.`,
    }).returning();

    return successResponse(res, request, "Pengajuan penutupan akun (ahli waris) berhasil dibuat. Menunggu persetujuan GM.");
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, "Gagal membuat pengajuan", 500);
  }
};

// GM (dan Admin) melihat antrian permohonan berhenti -- gabungan self-resign & ahli waris.
export const getPendingResignations = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.select({
      id: resignationRequests.id,
      userId: resignationRequests.userId,
      userName: users.name,
      userPhone: users.phone,
      bankName: users.bankName,
      bankAccountNumber: users.bankAccountNumber,
      bankAccountHolder: users.bankAccountHolder,
      reason: resignationRequests.reason,
      description: resignationRequests.description,
      status: resignationRequests.status,
      caseType: resignationRequests.caseType,
      disbursementMethod: resignationRequests.disbursementMethod,
      createdAt: resignationRequests.createdAt,
    })
      .from(resignationRequests)
      .innerJoin(users, eq(resignationRequests.userId, users.id))
      .where(eq(resignationRequests.status, 'pending'))
      .orderBy(desc(resignationRequests.createdAt));

    return successResponse(res, result, "Daftar Permohonan Berhenti");
  } catch (error) {
    return errorResponse(res, "Gagal ambil data permohonan", 500);
  }
};

const decideResignationSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

// Keputusan GM. Approve + bank_transfer -> berhenti di 'approved' (transfer &
// penutupan akun dilakukan manual di luar sistem untuk saat ini -- belum ada
// integrasi bank). Approve + cash_pickup -> 'awaiting_cashier', dieksekusi
// Kasir lewat treasuryController.executeHeirClosure.
export const decideResignation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, notes } = decideResignationSchema.parse(req.body);

    const [request] = await db.select().from(resignationRequests).where(eq(resignationRequests.id, id));
    if (!request) return errorResponse(res, "Permohonan tidak ditemukan", 404);
    if (request.status !== 'pending') return errorResponse(res, "Permohonan ini sudah diproses sebelumnya.", 400);

    if (decision === 'reject') {
      await db.update(resignationRequests)
        .set({ status: 'rejected', adminNotes: notes, approvedAt: new Date(), approvedBy: req.user.id })
        .where(eq(resignationRequests.id, id));
      return successResponse(res, null, "Permohonan ditolak.");
    }

    const nextStatus = request.disbursementMethod === 'cash_pickup' ? 'awaiting_cashier' : 'approved';

    await db.update(resignationRequests)
      .set({ status: nextStatus, adminNotes: notes, approvedAt: new Date(), approvedBy: req.user.id })
      .where(eq(resignationRequests.id, id));

    const message = nextStatus === 'awaiting_cashier'
      ? "Disetujui. Silahkan teruskan link eksekusi ke Kasir untuk pencairan tunai."
      : "Disetujui. Transfer dana ke rekening terdaftar dan penutupan akun dilakukan manual di luar sistem untuk saat ini.";

    return successResponse(res, { id, status: nextStatus }, message);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, "Gagal memproses keputusan", 500);
  }
};
