import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { otpCodes } from '../db/schema';
import { eq, and, isNull, gt, desc } from 'drizzle-orm';

export type OtpPurpose = 'registration' | 'kyc_verification' | 'password_reset';

// Kode 6 digit -- untuk yang diketik manual (registrasi, KYC).
export const generateNumericOtp = (): string =>
  Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join('');

// Token panjang acak -- untuk link reset password (bukan diketik, tapi diklik).
export const generateResetToken = (): string => crypto.randomBytes(32).toString('hex');

// Simpan kode/token baru (di-hash, sama seperti password/PIN). Tidak menghapus
// kode purpose yang sama sebelumnya -- verifyOtp cuma menerima yang belum
// expired & belum dipakai, jadi kode lama otomatis basi begitu yang baru dicek duluan.
export const createOtp = async (userId: string, purpose: OtpPurpose, code: string, ttlMinutes: number): Promise<void> => {
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await db.insert(otpCodes).values({ userId, purpose, codeHash, expiresAt });
};

// Cek kode/token terhadap semua kandidat purpose itu yang belum expired &
// belum dipakai (bisa lebih dari satu kalau user minta kirim ulang). Begitu
// cocok, langsung ditandai consumed supaya tidak bisa dipakai ulang.
export const verifyOtp = async (userId: string, purpose: OtpPurpose, code: string): Promise<boolean> => {
  const candidates = await db.select().from(otpCodes)
    .where(and(
      eq(otpCodes.userId, userId),
      eq(otpCodes.purpose, purpose),
      isNull(otpCodes.consumedAt),
      gt(otpCodes.expiresAt, new Date()),
    ))
    .orderBy(desc(otpCodes.createdAt));

  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.codeHash)) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, candidate.id));
      return true;
    }
  }
  return false;
};
