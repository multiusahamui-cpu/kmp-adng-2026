
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { errorResponse } from '../utils/response';

export const verifyPin = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;

    if (!pin) {
      return errorResponse(res, "PIN Transaksi wajib diisi", 400);
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.pin) {
      return errorResponse(res, "PIN belum diatur. Silahkan atur PIN di profil.", 400);
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
      return errorResponse(res, "PIN Transaksi Salah", 401);
    }
    
    next();
  } catch (error) {
    return errorResponse(res, "Gagal memverifikasi PIN", 500);
  }
};
