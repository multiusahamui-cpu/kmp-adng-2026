
import { Router, RequestHandler } from 'express';
import { register, login, verifyLoginOtp, requestKycOtp, verifyKycOtp, uploadKyc, payOnboarding } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp); // RUTE KRUSIAL DITAMBAHKAN

// KYC & OTP Flow
router.post('/kyc/request-otp', authenticate as RequestHandler, requestKycOtp as RequestHandler);
router.post('/kyc/verify-otp', authenticate as RequestHandler, verifyKycOtp as RequestHandler);

// Onboarding Assets
router.post('/onboarding/kyc', authenticate as RequestHandler, uploadKyc as RequestHandler);
router.post('/onboarding/payment', authenticate as RequestHandler, payOnboarding as RequestHandler);

export default router;
