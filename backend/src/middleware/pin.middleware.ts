
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { errorResponse } from '../utils/response';
import { checkLock, recordFailure, recordSuccess } from '../utils/attemptLimiter';

// Keyed by user id (already authenticated at this point), not IP — so this
// only ever locks out the one account being attacked, never other users.
const PIN_LIMIT = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };

export const verifyPin = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;
    const limiterKey = `pin:${userId}`;

    const lock = checkLock(limiterKey);
    if (lock.locked) {
      res.set('Retry-After', String(lock.retryAfterSeconds));
      return errorResponse(res, "Terlalu banyak percobaan PIN salah. Coba lagi dalam beberapa menit.", 429);
    }

    if (!pin) {
      return errorResponse(res, "PIN Transaksi wajib diisi", 400);
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.pin) {
      return errorResponse(res, "PIN belum diatur. Silahkan atur PIN di profil.", 400);
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
      const result = recordFailure(limiterKey, PIN_LIMIT);
      if (result.locked) {
        res.set('Retry-After', String(result.retryAfterSeconds));
        return errorResponse(res, "Terlalu banyak percobaan PIN salah. Coba lagi dalam beberapa menit.", 429);
      }
      return errorResponse(res, "PIN Transaksi Salah", 401);
    }

    recordSuccess(limiterKey);
    next();
  } catch (error) {
    return errorResponse(res, "Gagal memverifikasi PIN", 500);
  }
};
