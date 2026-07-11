
import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { getPendingApprovals, approveRoleApplication, getAllUsers, createRegion, getRegions, updateConfig, getConfig, runEodSettlement } from '../controllers/admin.controller';
import { getCOA, createAccount, createJournal, getBalanceSheet } from '../controllers/accounting.controller';
import { getPaymentRequests, executePayment, createPaymentRequest } from '../controllers/treasury.controller';
import { getLocations, createLocation, deleteLocation } from '../controllers/location.controller';

const router = Router();

// Global Middleware for this router group
router.use(authenticate as RequestHandler);

// 0. EOD SETTLEMENT
router.post('/eod-settlement', verifyRole(['admin', 'super_admin']), runEodSettlement as RequestHandler);

// 1. APPROVALS (Admin & GM)
// Fetch applications
router.get('/approvals/users', verifyRole(['admin', 'super_admin', 'general_manager']), getPendingApprovals as RequestHandler);
// Process application (approve/reject)
router.put('/approvals/applications/:id', verifyRole(['admin', 'super_admin']), approveRoleApplication as RequestHandler);

// 2. USER MANAGEMENT (Admin)
router.get('/users', verifyRole(['admin', 'super_admin']), getAllUsers as RequestHandler);

// 3. MASTER DATA (Super Admin)
router.post('/regions', verifyRole(['super_admin']), createRegion as RequestHandler); // Legacy
router.get('/regions', verifyRole(['admin', 'super_admin']), getRegions as RequestHandler); // Legacy
router.put('/config', verifyRole(['super_admin']), updateConfig as RequestHandler);
router.get('/config', getConfig as RequestHandler);

// --- NEW: MASTER DATA LOCATION (HIERARCHICAL) ---
router.get('/locations', verifyRole(['admin', 'super_admin', 'marketing_coordinator']), getLocations as RequestHandler);
router.post('/locations', verifyRole(['admin', 'super_admin']), createLocation as RequestHandler);
router.delete('/locations/:code', verifyRole(['admin', 'super_admin']), deleteLocation as RequestHandler);

// 4. ACCOUNTING (Accountant)
router.get('/accounting/coa', verifyRole(['accountant', 'admin']), getCOA as RequestHandler);
router.post('/accounting/coa', verifyRole(['accountant']), createAccount as RequestHandler);
router.post('/accounting/journal', verifyRole(['accountant']), createJournal as RequestHandler);
router.get('/accounting/reports/balance-sheet', verifyRole(['accountant', 'general_manager', 'admin']), getBalanceSheet as RequestHandler);

// 5. TREASURY (Cashier)
router.get('/treasury/requests', verifyRole(['cashier', 'general_manager']), getPaymentRequests as RequestHandler);
router.post('/treasury/request', createPaymentRequest as RequestHandler); // Any internal staff can request
router.post('/treasury/execute', verifyRole(['cashier']), executePayment as RequestHandler);

export default router;
