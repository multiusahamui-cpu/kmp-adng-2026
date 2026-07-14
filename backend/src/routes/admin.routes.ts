
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { getPendingApprovals, approveRoleApplication, getAllUsers, createRegion, getRegions, updateConfig, getConfig, runEodSettlement, createHeirResignation, getPendingResignations, decideResignation } from '../controllers/admin.controller';
import { getCOA, createAccount, createJournal, getBalanceSheet } from '../controllers/accounting.controller';
import { getPaymentRequests, executePayment, createPaymentRequest, getAwaitingCashierResignations, executeHeirClosure } from '../controllers/treasury.controller';
import { getLocations, createLocation, deleteLocation } from '../controllers/location.controller';

const router = Router();

// Global Middleware for this router group
router.use(authenticate as RequestHandler);

// 0. EOD SETTLEMENT
router.post('/eod-settlement', verifyRole(['admin', 'super_admin']) as RequestHandler, runEodSettlement as RequestHandler);

// 1. APPROVALS (Admin & GM)
// Fetch applications
router.get('/approvals/users', verifyRole(['admin', 'super_admin', 'general_manager']) as RequestHandler, getPendingApprovals as RequestHandler);
// Process application (approve/reject)
router.put('/approvals/applications/:id', verifyRole(['admin', 'super_admin']) as RequestHandler, approveRoleApplication as RequestHandler);

// 2. USER MANAGEMENT (Admin)
router.get('/users', verifyRole(['admin', 'super_admin']) as RequestHandler, getAllUsers as RequestHandler);

// 3. MASTER DATA (Super Admin)
router.post('/regions', verifyRole(['super_admin']) as RequestHandler, createRegion as RequestHandler); // Legacy
router.get('/regions', verifyRole(['admin', 'super_admin']) as RequestHandler, getRegions as RequestHandler); // Legacy
router.put('/config', verifyRole(['super_admin']) as RequestHandler, updateConfig as RequestHandler);
router.get('/config', getConfig as RequestHandler);

// --- NEW: MASTER DATA LOCATION (HIERARCHICAL) ---
router.get('/locations', verifyRole(['admin', 'super_admin', 'marketing_coordinator']) as RequestHandler, getLocations as RequestHandler);
router.post('/locations', verifyRole(['admin', 'super_admin']) as RequestHandler, createLocation as RequestHandler);
router.delete('/locations/:code', verifyRole(['admin', 'super_admin']) as RequestHandler, deleteLocation as RequestHandler);

// 4. ACCOUNTING (Accountant)
router.get('/accounting/coa', verifyRole(['accountant', 'admin']) as RequestHandler, getCOA as RequestHandler);
router.post('/accounting/coa', verifyRole(['accountant']) as RequestHandler, createAccount as RequestHandler);
router.post('/accounting/journal', verifyRole(['accountant']) as RequestHandler, createJournal as RequestHandler);
router.get('/accounting/reports/balance-sheet', verifyRole(['accountant', 'general_manager', 'admin']) as RequestHandler, getBalanceSheet as RequestHandler);

// 5. TREASURY (Cashier)
router.get('/treasury/requests', verifyRole(['cashier', 'general_manager']) as RequestHandler, getPaymentRequests as RequestHandler);
router.post('/treasury/request', createPaymentRequest as RequestHandler); // Any internal staff can request
router.post('/treasury/execute', verifyRole(['cashier']) as RequestHandler, executePayment as RequestHandler);

// 6. RESIGNATION / ACCOUNT CLOSURE (Self-resign & Ahli Waris)
// Admin membuat pengajuan atas nama anggota yang meninggal (berdasarkan email ahli waris).
router.post('/resignation/heir', verifyRole(['admin', 'super_admin']) as RequestHandler, createHeirResignation as RequestHandler);
// GM (dan Admin) lihat antrian permohonan berhenti.
router.get('/resignations', verifyRole(['admin', 'super_admin', 'general_manager']) as RequestHandler, getPendingResignations as RequestHandler);
// GM memutuskan approve/reject.
router.put('/resignations/:id/decide', verifyRole(['general_manager', 'super_admin']) as RequestHandler, decideResignation as RequestHandler);
// Kasir: antrian & eksekusi "PENCAIRAN TUTUP AHLI WARIS" (metode tunai).
router.get('/resignations/cashier-queue', verifyRole(['cashier']) as RequestHandler, getAwaitingCashierResignations as RequestHandler);
router.post('/resignations/:id/execute-cash', verifyRole(['cashier']) as RequestHandler, executeHeirClosure as RequestHandler);

export default router;
