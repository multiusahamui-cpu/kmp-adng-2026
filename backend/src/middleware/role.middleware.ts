
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response';

export const verifyRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: any) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    const userRoles = req.user.roles || []; // Array of strings from JWT payload
    
    // Check if user has AT LEAST ONE of the allowed roles
    const hasPermission = userRoles.some((role: string) => allowedRoles.includes(role));

    if (!hasPermission) {
      return errorResponse(res, "Forbidden: Akses Ditolak", 403);
    }

    next();
  };
};
