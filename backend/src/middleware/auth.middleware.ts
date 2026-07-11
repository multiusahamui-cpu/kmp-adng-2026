
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { JwtPayload } from 'jsonwebtoken';

// 1. Definisi Payload Token yang Pasti
export interface UserPayload extends JwtPayload {
  id: string;
  roles: string[];
  name?: string;
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

export const authenticate = (req: any, res: any, next: NextFunction) => {
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

    // Attach ke Request Object
    req.user = decoded as UserPayload;

    next();

  } catch (error: any) {
    console.error("[AUTH ERROR]", error.message);
    return errorResponse(res, 'Sesi berakhir. Silahkan login kembali.', 401);
  }
};
