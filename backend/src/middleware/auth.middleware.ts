
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { JwtPayload } from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// 1. Definisi Payload Token yang Pasti
export interface UserPayload extends JwtPayload {
  id: string;
  roles: string[];
  name?: string;
  tv?: number; // tokenVersion user saat token ini diterbitkan
}

// 2. Global Augmentation (Agar req.user dikenali di seluruh aplikasi)
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// 3. Interface Khusus Controller (Wajib diimport di Controller)
export interface AuthRequest extends Request {
  user: UserPayload; 
  body: any; // Mencegah error TS saat akses body
  query: any; // Mencegah error TS saat akses query
  params: any; // Mencegah error TS saat akses params
}

export const authenticate = async (req: any, res: any, next: NextFunction) => {
  try {
    // Handle case-insensitive header
    const authHeader = req.headers.authorization || req.headers['Authorization'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Unauthorized: Token tidak ditemukan', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi Token
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.id) {
        return errorResponse(res, 'Unauthorized: Token tidak valid', 401);
    }

    const payload = decoded as UserPayload;

    // Tolak token yang sudah dicabut (logout / ganti password / ganti PIN
    // menaikkan tokenVersion user di DB -- lihat backend/src/utils/jwt.ts).
    // Token lama tanpa claim `tv` (diterbitkan sebelum fitur ini ada) dianggap
    // tokenVersion 0, sama dengan default kolom baru -- jadi sesi yang sedang
    // aktif tidak mendadak ke-invalidate saat fitur ini di-deploy.
    const [user] = await db.select({ tokenVersion: users.tokenVersion }).from(users).where(eq(users.id, payload.id));
    if (!user || (payload.tv ?? 0) !== user.tokenVersion) {
      return errorResponse(res, 'Sesi sudah tidak berlaku. Silahkan login kembali.', 401);
    }

    // Attach ke Request Object
    req.user = payload;

    next();

  } catch (error: any) {
    console.error("[AUTH ERROR]", error.message);
    return errorResponse(res, 'Sesi berakhir. Silahkan login kembali.', 401);
  }
};
