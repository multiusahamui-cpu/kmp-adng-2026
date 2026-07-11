import { db } from '../db';
import { users, wallets, blacklistRegistrations, transactions, kordinatorDetails } from '../db/schema';
import { eq, or, ilike, inArray, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

const DEFAULT_OTP = '123456';

export const AuthService = {
  async register(data: any) {
    const blacklisted = await db.select().from(blacklistRegistrations).where(eq(blacklistRegistrations.phone, data.phone));
    if (blacklisted.length > 0) throw new Error("Nomor ini diblokir. Hubungi Admin.");

    const existingUsers = await db.select().from(users).where(
        or(eq(users.phone, data.phone), data.email ? eq(users.email, data.email) : undefined)
    );

    if (existingUsers.length > 0) {
        const u = existingUsers[0];
        if (u.status === 'pending') throw new Error("Akun sudah ada tapi belum aktif. Silahkan Login.");
        throw new Error("Nomor HP/Email sudah terdaftar.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const result = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            name: data.name,
            phone: data.phone,
            email: data.email,
            password: hashedPassword,
            status: 'pending', 
            roles: ['member'],
            otpAttempts: 0,
            referredBy: data.referralCode || null,
            preferences: { theme: 'light', notifications: { all: true, transaction: true, promo: true, chat: true } }
        }).returning();

        // Auto create wallet
        await tx.insert(wallets).values({ userId: newUser.id, balance: '0', savings: '0' });
        return newUser;
    });

    return { userId: result.id };
  },

  async login(identifier: string, password: string) {
    const [user] = await db.select().from(users).where(
        or(eq(users.phone, identifier), ilike(users.email, identifier))
    );

    if (!user) throw new Error("Akun tidak ditemukan");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Password salah");

    if (user.status === 'suspended') throw new Error("Akun dibekukan.");

    const isPhoneVerified = (user.preferences as any)?.isPhoneVerified === true;
    const isPending = user.status === 'pending' || user.status === 'awaiting_payment';

    if (isPending && !isPhoneVerified) {
        const token = generateToken({ id: user.id, roles: user.roles || [], name: user.name });
        return {
            status: true,
            message: "Login Berhasil (Pending). Meminta OTP.",
            data: { userId: user.id, token, action: 'OTP_REQUIRED' }
        };
    }

    const token = generateToken({ id: user.id, roles: user.roles || [], name: user.name });
    return {
        status: true,
        message: "Login Berhasil",
        data: { user, token, action: 'LOGIN_SUCCESS' }
    };
  },

  async verifyLoginOtp(userId: string, otp: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User tidak ditemukan");

    const cleanOtp = String(otp).trim();

    if (cleanOtp === DEFAULT_OTP) {
        const currentPrefs = user.preferences as any || {};
        await db.update(users).set({
            preferences: { ...currentPrefs, isPhoneVerified: true }
        }).where(eq(users.id, userId));

        const token = generateToken({ id: user.id, roles: user.roles || [], name: user.name });
        return { user, token, action: 'OTP_VERIFIED' };
    }

    throw new Error("Kode OTP Salah.");
  },

  async uploadKyc(userId: string, data: any) {
    await db.update(users).set({
        nik: data.nik,
        name: data.name,
        gender: data.gender,
        occupation: data.occupation,
        heir: data.heir,
        address: data.street,
        regional: data.regional,
        provinceId: data.provinceId,
        cityId: data.cityId,
        districtId: data.districtId,
        villageId: data.villageId,
        postalCode: data.postalCode,
        ktpPhoto: data.ktpPhoto, 
        selfiePhoto: data.selfiePhoto,
        kycDataSubmitted: true
    }).where(eq(users.id, userId));
  },

  async verifyKycOtp(userId: string, otp: string) {
    if (otp !== DEFAULT_OTP) {
        throw new Error("Kode OTP Salah. Silahkan coba lagi.");
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (!wallet) throw new Error("Wallet system error.");

    await db.transaction(async (tx) => {
        // Update Status User -> awaiting_payment
        await tx.update(users).set({ 
            status: 'awaiting_payment',
            kycVerified: true 
        }).where(eq(users.id, userId));

        // Buat Tagihan 1: Pendaftaran
        await tx.insert(transactions).values({
            walletId: wallet.id,
            type: 'BILL_REGISTRATION',
            amount: '100000',
            description: 'Biaya Pendaftaran Anggota Baru',
            status: 'pending',
            referenceId: `REG-${Date.now()}`
        });

        // Buat Tagihan 2: Simpanan Pokok
        await tx.insert(transactions).values({
            walletId: wallet.id,
            type: 'BILL_PRINCIPAL',
            amount: '50000',
            description: 'Simpanan Pokok Anggota (Wajib)',
            status: 'pending',
            referenceId: `PRINCIPAL-${Date.now()}`
        });
    });

    return { nextAction: 'PAYMENT_REQUIRED' };
  }
};
