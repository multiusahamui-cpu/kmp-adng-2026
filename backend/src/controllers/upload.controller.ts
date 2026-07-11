
import { Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import { uploadToCloudflare } from '../services/cloudflare.service';
import fs from 'fs';

export const uploadFile = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Tidak ada file yang diupload", 400);
    }

    // Buat URL Publik (Fallback)
    const protocol = req.protocol;
    const host = req.get('host');
    const localFileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    // Try upload to Cloudflare
    let finalUrl = localFileUrl;
    try {
        const cloudflareUrl = await uploadToCloudflare(req.file.path);
        if (cloudflareUrl) {
            finalUrl = cloudflareUrl;
            // Delete local file if uploaded successfully
            fs.unlinkSync(req.file.path);
        }
    } catch (cfError) {
        console.error("Cloudflare upload failed, using local file:", cfError);
        // Keep local file as fallback
    }

    return successResponse(res, {
        url: finalUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
    }, "File Berhasil Diupload");

  } catch (error: any) {
    return errorResponse(res, error.message || "Gagal upload file", 500);
  }
};
