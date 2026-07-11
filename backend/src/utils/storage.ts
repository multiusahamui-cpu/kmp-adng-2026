
import fs from 'fs';
import path from 'path';

// Pastikan folder upload ada
const uploadDir = path.join((process as any).cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const deleteFile = (filePath: string) => {
    // Fungsi helper untuk menghapus file lama jika update foto
    const fullPath = path.join((process as any).cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// Disini nanti logika Cloudflare R2 / S3 akan ditambahkan
// Jika process.env.STORAGE_TYPE === 'CLOUD', gunakan SDK S3
