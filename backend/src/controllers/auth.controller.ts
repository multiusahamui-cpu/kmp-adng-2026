
import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { kycUploadSchema, kycOtpSchema } from '../schemas/kyc.schema';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';

// MASTER KEY CONSTANT
const DEFAULT_OTP = '123456';

// Register (Public)
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    return successResponse(res, result, "Registrasi Berhasil. Silahkan Login.", 201);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Data tidak valid", 400, error.errors);
    return errorResponse(res, error.message || "Server Error", error.message ? 400 : 500);
  }
};

// Login (Public)
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const result = await AuthService.login(identifier, password);
    
    if (result.status && result.data?.action === 'OTP_REQUIRED') {
        return res.status(202).json(result);
    }

    return successResponse(res, result.data, result.message);
  } catch (error: any) {
    if (error.name === 'ZodError') return errorResponse(res, "Input tidak valid", 400, error.errors);
    console.error("[LOGIN ERROR]", error);
    return errorResponse(res, error.message || "Login Gagal", error.message ? 401 : 500);
  }
};

// Verify Login OTP (Public)
export const verifyLoginOtp = async (req: Request, res: Response) => {
    try {
        const { userId, otp } = req.body;
        if (!userId) return errorResponse(res, "User ID Missing", 400);

        const result = await AuthService.verifyLoginOtp(userId, otp);
        return successResponse(res, result, "Verifikasi Berhasil");
    } catch (error: any) {
        console.error("[VERIFY ERROR]", error);
        return errorResponse(res, error.message || "Terjadi kesalahan sistem", 400);
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
    // Logic kirim WA gateway disini
    return successResponse(res, { demoOtp: DEFAULT_OTP }, "OTP Dikirim ke WhatsApp");
};

export const verifyKycOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { otp } = kycOtpSchema.parse(req.body);
        const result = await AuthService.verifyKycOtp(req.user.id, otp);

        return successResponse(res, result, "Verifikasi Berhasil. Dompet Dibuka.");
    } catch (error: any) {
        if (error.name === 'ZodError') return errorResponse(res, "Format OTP Salah", 400, error.errors);
        return errorResponse(res, error.message || "Gagal verifikasi KYC", 400);
    }
};

export const payOnboarding = async (req: AuthRequest, res: Response) => {
    // Placeholder, logic pembayaran ada di wallet.controller
    return successResponse(res, {}, "Paid");
};
