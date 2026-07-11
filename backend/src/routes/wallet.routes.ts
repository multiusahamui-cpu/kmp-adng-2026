
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyPin } from '../middleware/pin.middleware';
import { getWalletInfo, topupBalance, transferBalance, payBill, withdrawVoluntarySavings } from '../controllers/wallet.controller';
import { purchasePPOB } from '../controllers/ppob.controller';

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', getWalletInfo as RequestHandler); // Alias /wallet
router.get('/balance', getWalletInfo as RequestHandler);
router.get('/history', getWalletInfo as RequestHandler); // Controller returns history too

router.post('/topup', topupBalance as RequestHandler);

// Transaksi Keluar Wajib PIN
router.post('/transfer', verifyPin as RequestHandler, transferBalance as RequestHandler);
router.post('/ppob', verifyPin as RequestHandler, purchasePPOB as RequestHandler);
router.post('/withdraw/voluntary', verifyPin as RequestHandler, withdrawVoluntarySavings as RequestHandler);

// Bayar Tagihan (Onboarding dll) - Bisa pakai PIN atau tidak, asumsi dalam flow onboarding user belum set PIN
// Kita buat simple tanpa PIN dulu untuk onboarding, atau opsional
router.post('/bill/pay', payBill as RequestHandler);

// QRIS Payment Mock (Re-use transfer/payment logic)
router.post('/pay/qris', verifyPin as RequestHandler, (async (req, res) => {
    // Logic similar to transfer but destination is merchant ID from QR
    return transferBalance(req as any, res); 
}) as RequestHandler);

export default router;
