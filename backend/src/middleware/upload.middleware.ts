
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { isAllowedImage, SIGNATURE_CHECK_BYTES } from '../utils/imageSignature';
import { errorResponse } from '../utils/response';

// Konfigurasi Penyimpanan Lokal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Naming: timestamp-random-originalName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter File (Hanya Gambar)
const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: fileFilter
});

// Extension/mimetype above are client-supplied and easy to spoof (e.g. a
// script renamed to photo.png with Content-Type: image/png). This runs AFTER
// multer has already written the file to disk and checks the real bytes
// against known image signatures — mismatches get deleted before any
// controller (and Cloudflare upload / public /uploads serving) sees them.
export const validateFileContent = (req: Request, res: Response, next: NextFunction) => {
  const file = (req as any).file;
  if (!file) return next();

  fs.open(file.path, 'r', (openErr, fd) => {
    if (openErr) return next(openErr);

    const buffer = Buffer.alloc(SIGNATURE_CHECK_BYTES);
    fs.read(fd, buffer, 0, SIGNATURE_CHECK_BYTES, 0, (readErr) => {
      fs.close(fd, () => {
        if (readErr) return next(readErr);

        if (!isAllowedImage(buffer)) {
          fs.unlink(file.path, () => {
            return errorResponse(res, 'File tidak valid: isi file tidak sesuai dengan format gambar yang diizinkan.', 400);
          });
          return;
        }

        next();
      });
    });
  });
};
