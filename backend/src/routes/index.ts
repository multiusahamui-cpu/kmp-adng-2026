
import { Router } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import walletRoutes from './wallet.routes';
import marketplaceRoutes from './marketplace.routes';
import coopRoutes from './coop.routes';
import ppobRoutes from './ppob.routes';
import contentRoutes from './content.routes';
import traderRoutes from './trader.routes';
import rideRoutes from './ride.routes';
import wholesaleRoutes from './wholesale.routes';
import financingRoutes from './financing.routes';
import communityRoutes from './community.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import locationRoutes from './location.routes';
import accountingRoutes from './accounting.routes';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Deep Health Check (Server + Database)
router.get('/health', async (req, res) => {
  try {
    // Attempt a lightweight query to ensure DB connection is alive
    await db.execute(sql`SELECT 1`);
    
    return successResponse(res, { 
      uptime: (process as any).uptime(),
      timestamp: new Date(),
      database: 'connected'
    }, "System Operational");
  } catch (error: any) {
    console.error("Health Check Failed: DB Connection Lost", error.message);
    // Return 503 Service Unavailable so client knows backend is broken
    return errorResponse(res, "System Maintenance: Database Unreachable", 503);
  }
});

// Mount Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/coop', coopRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/ppob', ppobRoutes);
router.use('/content', contentRoutes);
router.use('/upload', uploadRoutes);
router.use('/locations', locationRoutes);

// Feature Specific
router.use('/trader', traderRoutes);
router.use('/ride', rideRoutes);
router.use('/wholesale', wholesaleRoutes);
router.use('/financing', financingRoutes);
router.use('/community', communityRoutes);
router.use('/accounting', accountingRoutes);

// ADMIN & INTERNAL
router.use('/admin', adminRoutes);

export default router;
