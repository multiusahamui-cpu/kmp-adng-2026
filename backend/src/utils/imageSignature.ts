// Validates the actual bytes of an uploaded file against known magic numbers
// for the image formats upload.middleware.ts's fileFilter claims to allow.
// Extension/mimetype are client-supplied and trivially spoofable — this checks
// what the file actually is. Intentionally minimal (4 known formats) rather
// than pulling in a general-purpose file-type detection library.

export type AllowedImageType = 'jpeg' | 'png' | 'gif' | 'webp';

const SIGNATURES: Record<AllowedImageType, (buf: Buffer) => boolean> = {
  jpeg: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  png: (buf) =>
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a,
  gif: (buf) =>
    buf.length >= 6 &&
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61, // GIF87a / GIF89a
  webp: (buf) =>
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // "RIFF"
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50, // "WEBP"
};

// Read this many bytes from disk before deciding — the largest signature we
// check (WEBP) needs 12.
export const SIGNATURE_CHECK_BYTES = 12;

export function isAllowedImage(buf: Buffer): boolean {
  return Object.values(SIGNATURES).some((check) => check(buf));
}
