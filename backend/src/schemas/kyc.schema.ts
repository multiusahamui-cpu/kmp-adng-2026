import { z } from 'zod';

export const kycUploadSchema = z.object({
  nik: z.string().length(16, "NIK harus 16 digit"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  gender: z.enum(['Laki-laki', 'Perempuan']),
  occupation: z.string().min(3, "Pekerjaan minimal 3 karakter"),
  heir: z.string().min(3, "Nama ahli waris minimal 3 karakter"),
  street: z.string().min(5, "Alamat minimal 5 karakter"),
  regional: z.string().optional(), // New field
  provinceId: z.string().min(1, "Provinsi wajib diisi"),
  cityId: z.string().min(1, "Kota/Kabupaten wajib diisi"),
  districtId: z.string().min(1, "Kecamatan wajib diisi"),
  villageId: z.string().min(1, "Desa/Kelurahan wajib diisi"),
  postalCode: z.string().min(5, "Kode Pos wajib diisi"),
  ktpPhoto: z.string().optional(), // Base64 or URL
  selfiePhoto: z.string().optional(), // Base64 or URL
});

export const kycOtpSchema = z.object({
  otp: z.string().length(6, "OTP harus 6 digit"),
});
