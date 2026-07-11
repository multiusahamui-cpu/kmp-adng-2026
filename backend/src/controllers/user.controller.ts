
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../db';
import { users, roleApplications, resignationRequests, kordinatorDetails, locations } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';

const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  heir: z.string().optional(),
});

const setPinSchema = z.object({
  pin: z.string().length(6, "PIN harus 6 digit angka").regex(/^\d+$/, "PIN harus angka"),
  oldPin: z.string().optional(),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Password lama harus diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter")
});

const preferencesSchema = z.object({
    theme: z.enum(['light', 'dark']).optional(),
    notifications: z.object({
        all: z.boolean(),
        transaction: z.boolean(),
        promo: z.boolean(),
        chat: z.boolean()
    }).optional()
});

const roleRequestSchema = z.object({
    role: z.string().min(1),
    details: z.any().optional()
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db.select({
        id: users.id, 
        name: users.name, 
        email: users.email, 
        phone: users.phone,
        roles: users.roles, 
        status: users.status, 
        ktaId: users.ktaId, 
        referralCode: users.referralCode,
        address: users.address,
        heir: users.heir,
        nik: users.nik,
        gender: users.gender,
        occupation: users.occupation,
        ktpPhoto: users.ktpPhoto,
        selfiePhoto: users.selfiePhoto,
        regional: users.regional,
        provinceId: users.provinceId,
        cityId: users.cityId,
        districtId: users.districtId,
        villageId: users.villageId,
        postalCode: users.postalCode,
        preferences: users.preferences,
        shopDetails: users.shopDetails,
        driverDetails: users.driverDetails,
        exchangerDetails: users.exchangerDetails,
        mobileTraderDetails: users.mobileTraderDetails,
        marketingRoleDetails: users.marketingRoleDetails,
        // Don't send PIN/Password hash
        pinResetStatus: users.pin 
    }).from(users).where(eq(users.id, req.user.id));

    // Inject boolean for UI
    const safeUser = {
        ...user,
        transactionPin: user.pinResetStatus ? 'SET' : undefined, 
        pinResetStatus: undefined 
    };

    return successResponse(res, safeUser, "Profil User");
  } catch (error) {
    return errorResponse(res, "Gagal ambil profil", 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const [user] = await db.update(users)
        .set(data)
        .where(eq(users.id, req.user.id))
        .returning();
        
    return successResponse(res, user, "Profil diperbarui");
  } catch (error: any) {
    return errorResponse(res, error.message || "Gagal update profil", 400);
  }
};

export const setPin = async (req: AuthRequest, res: Response) => {
  try {
    const { pin, oldPin } = setPinSchema.parse(req.body);
    const userId = req.user.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Jika user sudah punya PIN, wajib kirim oldPin
    if (user?.pin && !oldPin) {
      return errorResponse(res, "PIN Lama wajib diisi", 400);
    }

    if (user?.pin && oldPin) {
        const isValid = await bcrypt.compare(oldPin, user.pin);
        if (!isValid) return errorResponse(res, "PIN Lama salah", 400);
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    
    await db.update(users).set({ pin: hashedPin }).where(eq(users.id, userId));

    return successResponse(res, null, "PIN Transaksi Berhasil Diatur");
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "PIN tidak valid (6 digit angka)", 400);
    return errorResponse(res, "Gagal atur PIN", 500);
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
        const userId = req.user.id;

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if(!user) return errorResponse(res, "User not found", 404);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if(!isMatch) return errorResponse(res, "Password lama salah", 400);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

        return successResponse(res, null, "Password Berhasil Diubah");
    } catch (error: any) {
        if (error.name === 'ZodError') return errorResponse(res, "Format password salah", 400);
        return errorResponse(res, "Gagal ganti password", 500);
    }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
    try {
        const data = preferencesSchema.parse(req.body);
        const userId = req.user.id;

        // Get current prefs first to merge
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const currentPrefs = user?.preferences || { theme: 'light', notifications: { all: true } };

        const newPrefs = {
            ...currentPrefs,
            ...data,
            notifications: {
                ...(currentPrefs as any).notifications,
                ...(data.notifications || {})
            }
        };

        const [updatedUser] = await db.update(users)
            .set({ preferences: newPrefs })
            .where(eq(users.id, userId))
            .returning();

        return successResponse(res, updatedUser.preferences, "Pengaturan Disimpan");
    } catch (error) {
        return errorResponse(res, "Gagal simpan pengaturan", 500);
    }
};

export const generateReferral = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (user?.referralCode) {
            return successResponse(res, { referralCode: user.referralCode }, "Kode Referral Sudah Ada");
        }

        const firstName = user?.name.split(' ')[0].toUpperCase().substring(0, 4).replace(/[^A-Z]/g, '') || 'USER';
        
        let isUnique = false;
        let newCode = '';
        
        // Loop to ensure absolute uniqueness across millions of users
        while (!isUnique) {
            // Generate 6 random alphanumeric characters
            const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            newCode = `REF-${firstName}-${randomStr}`;
            
            // Check if it already exists in the database
            const [existing] = await db.select().from(users).where(eq(users.referralCode, newCode)).limit(1);
            if (!existing) {
                isUnique = true;
            }
        }

        const [updatedUser] = await db.update(users)
            .set({ referralCode: newCode })
            .where(eq(users.id, userId))
            .returning();

        return successResponse(res, { referralCode: updatedUser.referralCode }, "Kode Referral Berhasil Dibuat");
    } catch (error) {
        return errorResponse(res, "Gagal generate referral", 500);
    }
};

export const requestRole = async (req: AuthRequest, res: Response) => {
    try {
        const { role, details } = roleRequestSchema.parse(req.body);
        const userId = req.user.id;

        // 1. Check if user already has this role
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user.roles?.includes(role)) {
            return errorResponse(res, `Anda sudah memiliki role ${role}`, 400);
        }

        // 2. Check existing pending application for this specific role
        const [existing] = await db.select().from(roleApplications)
            .where(and(
                eq(roleApplications.userId, userId),
                eq(roleApplications.role, role),
                eq(roleApplications.status, 'pending')
            ));
        
        if (existing) {
            return errorResponse(res, "Pengajuan untuk role ini sedang diproses.", 400);
        }

        // 3. Create Application
        const [app] = await db.insert(roleApplications).values({
            userId,
            role,
            data: details || {},
            status: 'pending'
        }).returning();

        return successResponse(res, app, "Pengajuan Role Berhasil Dikirim. Menunggu Approval Admin.");
    } catch (error: any) {
        if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400);
        return errorResponse(res, "Gagal mengajukan role", 500);
    }
};

export const getMyRoleApplications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const apps = await db.select().from(roleApplications)
            .where(eq(roleApplications.userId, userId))
            .orderBy(roleApplications.createdAt); // oldest first
        
        return successResponse(res, apps, "Status Pengajuan Role");
    } catch (error) {
        return errorResponse(res, "Gagal ambil status pengajuan", 500);
    }
};

export const requestResignation = async (req: AuthRequest, res: Response) => {
    try {
        const { reason, description } = req.body;
        const userId = req.user.id;

        if (!reason) {
            return errorResponse(res, "Alasan berhenti wajib diisi", 400);
        }

        // Check if already requested
        const [existing] = await db.select().from(resignationRequests)
            .where(and(eq(resignationRequests.userId, userId), eq(resignationRequests.status, 'pending')))
            .limit(1);
        
        if (existing) {
            return errorResponse(res, "Anda sudah memiliki permohonan berhenti yang sedang diproses.", 400);
        }

        await db.insert(resignationRequests).values({
            userId,
            reason,
            description,
            status: 'pending'
        });

        return successResponse(res, null, "Permohonan berhenti berhasil dikirim. Menunggu persetujuan Admin.");

    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal mengirim permohonan", 500);
    }
};

export const checkCoordinatorArea = async (req: AuthRequest, res: Response) => {
    try {
        const { locationCode } = req.query;
        if (!locationCode) return errorResponse(res, "Kode lokasi diperlukan", 400);

        const [existing] = await db.select({
            coordinatorId: locations.coordinatorId,
            name: users.name
        })
        .from(locations)
        .leftJoin(users, eq(locations.coordinatorId, users.id))
        .where(eq(locations.code, locationCode as string))
        .limit(1);

        if (existing && existing.coordinatorId) {
            return successResponse(res, { occupied: true, occupiedBy: existing.name || 'Anggota Lain' }, "Wilayah sudah terisi");
        }

        return successResponse(res, { occupied: false }, "Wilayah tersedia");
    } catch (error: any) {
        return errorResponse(res, "Gagal mengecek ketersediaan wilayah", 500);
    }
};

export const getKordinatorDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const details = await db.select().from(kordinatorDetails).where(eq(kordinatorDetails.userId, userId));
        return successResponse(res, details, "Berhasil mengambil data kordinator");
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal mengambil data kordinator", 500);
    }
};

export const dismissKordinator = async (req: AuthRequest, res: Response) => {
    try {
        const { coordinatorId, reason } = req.body;

        if (!coordinatorId || !reason) {
            return errorResponse(res, "ID Kordinator dan alasan pemberhentian wajib diisi", 400);
        }

        // Only admin or super_admin should be able to do this.
        // Assuming req.user.roles contains 'admin' or 'super_admin'
        if (!req.user.roles?.includes('admin') && !req.user.roles?.includes('super_admin')) {
            return errorResponse(res, "Akses ditolak. Hanya Admin yang dapat memberhentikan Kordinator.", 403);
        }

        const [activeRecord] = await db.select().from(kordinatorDetails)
            .where(and(eq(kordinatorDetails.userId, coordinatorId), eq(kordinatorDetails.status, 'active')))
            .limit(1);

        if (!activeRecord) {
            return errorResponse(res, "Kordinator tidak ditemukan atau sudah tidak aktif", 404);
        }

        // Update record to history and clear locationCode
        await db.update(kordinatorDetails)
            .set({ status: 'history', locationCode: '' }) // Optionally save the reason in a new field or adminNotes
            .where(eq(kordinatorDetails.id, activeRecord.id));

        // Clear coordinatorId from old location
        if (activeRecord.locationCode) {
            await db.update(locations)
                .set({ coordinatorId: null })
                .where(eq(locations.code, activeRecord.locationCode));
        }

        return successResponse(res, null, "Kordinator berhasil diberhentikan");
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal memberhentikan Kordinator", 500);
    }
};

export const promoteKordinator = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { newLevel } = req.body;

        if (!newLevel) {
            return errorResponse(res, "Level baru wajib diisi", 400);
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return errorResponse(res, "User tidak ditemukan", 404);

        let newLocationCode = '';
        if (newLevel === 'Desa/Kelurahan') newLocationCode = user.villageId || '';
        else if (newLevel === 'Kecamatan') newLocationCode = user.districtId || '';
        else if (newLevel === 'Kota/Kabupaten') newLocationCode = user.cityId || '';
        else if (newLevel === 'Provinsi') newLocationCode = user.provinceId || '';
        else if (newLevel === 'Regional') newLocationCode = user.regional || '';

        if (!newLocationCode) {
            return errorResponse(res, "Kode lokasi untuk level tersebut tidak ditemukan pada profil Anda", 400);
        }

        // Check if the new location is already occupied
        const [existingCoordinator] = await db.select({
            coordinatorId: locations.coordinatorId
        }).from(locations)
            .where(eq(locations.code, newLocationCode))
            .limit(1);

        if (existingCoordinator && existingCoordinator.coordinatorId) {
            return errorResponse(res, `Posisi Kordinator ${newLevel} untuk wilayah ini sudah terisi`, 400);
        }

        // Find active coordinator record
        const [activeRecord] = await db.select().from(kordinatorDetails)
            .where(and(eq(kordinatorDetails.userId, userId), eq(kordinatorDetails.status, 'active')))
            .limit(1);

        if (activeRecord) {
            // Update old record to history and clear locationCode
            await db.update(kordinatorDetails)
                .set({ status: 'history', locationCode: '' })
                .where(eq(kordinatorDetails.id, activeRecord.id));
                
            // Clear coordinatorId from old location
            if (activeRecord.locationCode) {
                await db.update(locations)
                    .set({ coordinatorId: null })
                    .where(eq(locations.code, activeRecord.locationCode));
            }
        }

        // Create new record for the new level
        await db.insert(kordinatorDetails).values({
            userId,
            level: newLevel,
            status: 'active',
            memberCounter: 0,
            locationCode: newLocationCode
        });

        // Update locations table with the new coordinator
        await db.update(locations)
            .set({ coordinatorId: userId })
            .where(eq(locations.code, newLocationCode));

        // Add marketing_coordinator role to user if not already present
        const currentRoles = user.roles || [];
        if (!currentRoles.includes('marketing_coordinator')) {
            await db.update(users)
                .set({ roles: [...currentRoles, 'marketing_coordinator'] })
                .where(eq(users.id, userId));
        }

        return successResponse(res, null, `Berhasil dipromosikan menjadi Kordinator ${newLevel}`);
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal memproses promosi", 500);
    }
};
