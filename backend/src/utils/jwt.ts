
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'kmp-adng-super-secret-key-123';

export const generateToken = (payload: object) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '3d' });
};

// Return type bisa JwtPayload atau string
export const verifyToken = (token: string): JwtPayload | string => {
  return jwt.verify(token, SECRET_KEY);
};
