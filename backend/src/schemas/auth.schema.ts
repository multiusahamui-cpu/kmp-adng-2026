import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  phone: z.string().min(10, "Nomor HP tidak valid"),
  email: z.string().email("Email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email atau Nomor HP wajib diisi"), // Bisa email atau phone
  password: z.string().min(1, "Password wajib diisi"),
});
