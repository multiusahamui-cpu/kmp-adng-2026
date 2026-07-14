
import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, verifyLoginOtp, requestKycOtp, verifyKycOtp, uploadKyc, payOnboarding, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Loose, IP-based second layer (anti-scanning/anti-DoS) — deliberately generous
// so it never bothers real users; the per-identifier lockout in the controllers
// (attemptLimiter) is what actually stops brute force on a single account.
const authIpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Terlalu banyak permintaan dari perangkat ini. Coba lagi nanti.' },
});

router.post('/register', authIpLimiter, register); // sekarang benar-benar kirim email OTP -- dilindungi juga dari spam
router.post('/login', authIpLimiter, login);
router.post('/verify-login-otp', authIpLimiter, verifyLoginOtp); // RUTE KRUSIAL DITAMBAHKAN
router.post('/logout', authenticate as RequestHandler, logout as RequestHandler);
router.post('/forgot-password', authIpLimiter, forgotPassword);
router.post('/reset-password', authIpLimiter, resetPassword);

// KYC & OTP Flow
router.post('/kyc/request-otp', authenticate as RequestHandler, requestKycOtp as RequestHandler);
router.post('/kyc/verify-otp', authenticate as RequestHandler, verifyKycOtp as RequestHandler);

// Onboarding Assets
router.post('/onboarding/kyc', authenticate as RequestHandler, uploadKyc as RequestHandler);
router.post('/onboarding/payment', authenticate as RequestHandler, payOnboarding as RequestHandler);

export default router;
