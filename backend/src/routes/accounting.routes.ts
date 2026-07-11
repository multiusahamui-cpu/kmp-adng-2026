import { Router } from "express";
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
router.post("/coa/seed", authenticate, seedDefaultCOA); // Allow authenticated users to seed for now, or restrict to admin
router.get("/coa", authenticate, getCOA);
router.get("/journal", authenticate, getJournals);
router.get("/reports/balance-sheet", authenticate, getBalanceSheet);

// Accountant Only Routes
// Assuming 'accountant' role exists and authorize middleware supports it
router.post(
  "/coa",
  authenticate,
  verifyRole(["admin", "accountant"]),
  createAccount,
);
router.put(
  "/coa/:id",
  authenticate,
  verifyRole(["admin", "accountant"]),
  updateAccount,
);
router.delete(
  "/coa/:id",
  authenticate,
  verifyRole(["admin", "accountant"]),
  deleteAccount,
);
router.post(
  "/journal",
  authenticate,
  verifyRole(["admin", "accountant"]),
  createJournal,
);

export default router;
