
import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { kycUploadSchema, kycOtpSchema } from '../schemas/kyc.schema';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { checkLock, recordFailure, recordSuccess } from '../utils/attemptLimiter';

// Keyed by the identifier being attempted (phone/email), not IP — many real
// users sharing an IP (office WiFi, carrier NAT) never lock each other out.
// Broad anti-scanning by IP is handled separately at the route level.
const LOGIN_LIMIT = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };
const OTP_LIMIT = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };
const FORGOT_PASSWORD_LIMIT = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };
const RESET_PASSWORD_LIMIT = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };

// Register (Public)
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    return successResponse(res, result, "Registrasi Berhasil. Kode verifikasi dikirim ke email Anda.", 201);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, error.message || "Server Error", error.message ? 400 : 500);
  }
};

// Login (Public)
export const login = async (req: Request, res: Response) => {
  let identifier: string | undefined;
  try {
    const parsed = loginSchema.parse(req.body);
    identifier = parsed.identifier;
    const limiterKey = `login:${identifier.toLowerCase()}`;

    const lock = checkLock(limiterKey);
    if (lock.locked) {
      res.set('Retry-After', String(lock.retryAfterSeconds));
      return errorResponse(res, "Terlalu banyak percobaan login gagal. Coba lagi dalam beberapa menit.", 429);
    }

    const result = await AuthService.login(parsed.identifier, parsed.password);

    recordSuccess(limiterKey);

    if (result.status && result.data?.action === 'OTP_REQUIRED') {
        return res.status(202).json(result);
    }

    return successResponse(res, result.data, result.message);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Input tidak valid", 400, error.errors);

    if (identifier) {
      const result = recordFailure(`login:${identifier.toLowerCase()}`, LOGIN_LIMIT);
      if (result.locked) {
        res.set('Retry-After', String(result.retryAfterSeconds));
        return errorResponse(res, "Terlalu banyak percobaan login gagal. Coba lagi dalam beberapa menit.", 429);
      }
    }

    console.error("[LOGIN ERROR]", error);
    return errorResponse(res, error.message || "Login Gagal", error.message ? 401 : 500);
  }
};

// Verify Login OTP (Public)
export const verifyLoginOtp = async (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    try {
        if (!userId) return errorResponse(res, "User ID Missing", 400);

        const limiterKey = `otp:${userId}`;
        const lock = checkLock(limiterKey);
        if (lock.locked) {
          res.set('Retry-After', String(lock.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak percobaan OTP salah. Coba lagi dalam beberapa menit.", 429);
        }

        const result = await AuthService.verifyLoginOtp(userId, otp);
        recordSuccess(limiterKey);
        return successResponse(res, result, "Verifikasi Berhasil");
    } catch (error: any) {
        if (userId) {
          const result = recordFailure(`otp:${userId}`, OTP_LIMIT);
          if (result.locked) {
            res.set('Retry-After', String(result.retryAfterSeconds));
            return errorResponse(res, "Terlalu banyak percobaan OTP salah. Coba lagi dalam beberapa menit.", 429);
          }
        }
        console.error("[VERIFY ERROR]", error);
        return errorResponse(res, error.message || "Terjadi kesalahan sistem", 400);
    }
};

// Logout (Protected) — menaikkan tokenVersion supaya token yang beredar
// (di device ini maupun device lain) langsung tidak valid, bukan cuma
// dihapus dari localStorage di frontend.
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    await AuthService.logout(req.user.id);
    return successResponse(res, null, "Logout berhasil");
  } catch (error: any) {
    return errorResponse(res, "Gagal logout", 500);
  }
};

// --- KYC FUNCTIONS (Protected via AuthRequest) ---

export const uploadKyc = async (req: AuthRequest, res: Response) => {
    try {
        // Validate request body using Zod
        // Note: The frontend sends fields like 'street' but schema expects 'street'. 
        // Ensure frontend sends correct keys or map them here if needed.
        // Based on Settings.tsx: 
        // nik, name, gender, occupation, heir, street, provinceId, cityId, districtId, villageId, postalCode
        
        const validatedData = kycUploadSchema.parse(req.body);
        
        await AuthService.uploadKyc(req.user.id, validatedData);

        return successResponse(res, null, "Data Tersimpan. Silahkan Verifikasi OTP.");
    } catch (error: any) {
        if (error.name === 'ZodError') return errorResponse(res, "Data KYC tidak valid", 400, error.errors);
        return errorResponse(res, "Gagal menyimpan data KYC", 500);
    }
};

export const requestKycOtp = async (req: AuthRequest, res: Response) => {
    try {
        await AuthService.requestKycOtp(req.user.id);
        return successResponse(res, null, "OTP Dikirim ke Email");
    } catch (error: any) {
        return errorResponse(res, error.message || "Gagal mengirim OTP", 400);
    }
};

export const verifyKycOtp = async (req: AuthRequest, res: Response) => {
    const limiterKey = `otp:${req.user.id}`;
    try {
        const lock = checkLock(limiterKey);
        if (lock.locked) {
          res.set('Retry-After', String(lock.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak percobaan OTP salah. Coba lagi dalam beberapa menit.", 429);
        }

        const { otp } = kycOtpSchema.parse(req.body);
        const result = await AuthService.verifyKycOtp(req.user.id, otp);

        recordSuccess(limiterKey);
        return successResponse(res, result, "Verifikasi Berhasil. Dompet Dibuka.");
    } catch (error: any) {
        if (error.name === 'ZodError') return errorResponse(res, "Format OTP Salah", 400, error.errors);

        const result = recordFailure(limiterKey, OTP_LIMIT);
        if (result.locked) {
          res.set('Retry-After', String(result.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak percobaan OTP salah. Coba lagi dalam beberapa menit.", 429);
        }
        return errorResponse(res, error.message || "Gagal verifikasi KYC", 400);
    }
};

export const payOnboarding = async (req: AuthRequest, res: Response) => {
    // Placeholder, logic pembayaran ada di wallet.controller
    return successResponse(res, {}, "Paid");
};

// --- FORGOT / RESET PASSWORD (Public) ---

const GENERIC_FORGOT_MESSAGE = "Kalau akun dengan identitas tersebut terdaftar dan punya email, link reset password sudah dikirim.";

export const forgotPassword = async (req: Request, res: Response) => {
    const { identifier } = req.body;
    try {
        if (!identifier) return errorResponse(res, "Email atau Nomor HP wajib diisi", 400);

        const limiterKey = `forgot-password:${String(identifier).toLowerCase()}`;
        const lock = checkLock(limiterKey);
        if (lock.locked) {
          res.set('Retry-After', String(lock.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak permintaan. Coba lagi dalam beberapa menit.", 429);
        }
        // Selalu dihitung sebagai "percobaan" (bukan cuma saat gagal) -- ini
        // membatasi FREKUENSI permintaan (anti-spam ke inbox orang), beda dari
        // limiter login/OTP yang cuma menghitung percobaan salah.
        recordFailure(limiterKey, FORGOT_PASSWORD_LIMIT);

        const resetLinkBase = `${req.protocol}://${req.get('host')}/reset-password`;
        await AuthService.forgotPassword(identifier, resetLinkBase);

        return successResponse(res, null, GENERIC_FORGOT_MESSAGE);
    } catch (error: any) {
        console.error("[FORGOT PASSWORD ERROR]", error);
        // Tetap balas sukses generik meski ada error internal -- jangan bocorkan
        // detail teknis lewat endpoint publik ini.
        return successResponse(res, null, GENERIC_FORGOT_MESSAGE);
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { uid, token, newPassword } = req.body;
    try {
        if (!uid || !token || !newPassword) return errorResponse(res, "Data tidak lengkap", 400);
        if (String(newPassword).length < 6) return errorResponse(res, "Password baru minimal 6 karakter", 400);

        const limiterKey = `reset-password:${uid}`;
        const lock = checkLock(limiterKey);
        if (lock.locked) {
          res.set('Retry-After', String(lock.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.", 429);
        }

        await AuthService.resetPassword(uid, token, newPassword);
        recordSuccess(limiterKey);
        return successResponse(res, null, "Password berhasil diubah. Silahkan login dengan password baru.");
    } catch (error: any) {
        const result = recordFailure(`reset-password:${uid}`, RESET_PASSWORD_LIMIT);
        if (result.locked) {
          res.set('Retry-After', String(result.retryAfterSeconds));
          return errorResponse(res, "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.", 429);
        }
        return errorResponse(res, error.message || "Gagal reset password", 400);
    }
};
