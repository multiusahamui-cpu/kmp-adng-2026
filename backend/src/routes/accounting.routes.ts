import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { verifyRole } from "../middleware/role.middleware";
import {
  getCOA,
  createAccount,
  updateAccount,
  deleteAccount,
  getJournals,
  createJournal,
  getBalanceSheet,
  seedDefaultCOA,
} from "../controllers/accounting.controller";

const router = Router();

// Public or Authenticated Routes
router.post("/coa/seed", authenticate as RequestHandler, seedDefaultCOA as RequestHandler); // Allow authenticated users to seed for now, or restrict to admin
router.get("/coa", authenticate as RequestHandler, getCOA as RequestHandler);
router.get("/journal", authenticate as RequestHandler, getJournals as RequestHandler);
router.get("/reports/balance-sheet", authenticate as RequestHandler, getBalanceSheet as RequestHandler);

// Accountant Only Routes
// Assuming 'accountant' role exists and authorize middleware supports it
router.post(
  "/coa",
  authenticate as RequestHandler,
  verifyRole(["admin", "accountant"]) as RequestHandler,
  createAccount as RequestHandler,
);
router.put(
  "/coa/:id",
  authenticate as RequestHandler,
  verifyRole(["admin", "accountant"]) as RequestHandler,
  updateAccount as RequestHandler,
);
router.delete(
  "/coa/:id",
  authenticate as RequestHandler,
  verifyRole(["admin", "accountant"]) as RequestHandler,
  deleteAccount as RequestHandler,
);
router.post(
  "/journal",
  authenticate as RequestHandler,
  verifyRole(["admin", "accountant"]) as RequestHandler,
  createJournal as RequestHandler,
);

export default router;
