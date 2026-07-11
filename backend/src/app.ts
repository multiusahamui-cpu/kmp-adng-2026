
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// --- 1. CONFIGURATION ---
// Matikan ETag global dulu, nanti kita kontrol manual
app.set('etag', false); 

// --- 2. MIDDLEWARES UMUM ---
app.use(cors() as any); 
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } 
  }) as any
); 
app.use(morgan('dev') as any); 
app.use(express.json() as any); 
app.use(express.urlencoded({ extended: true }) as any);

// --- 3. STATIC FILES (CACHE BOLEH DI SINI) ---
// Kita taruh Static Files SEBELUM No-Cache Middleware.
// Browser boleh menyimpan gambar/logo di cache supaya hemat bandwidth & cepat.
// maxAge: 1 hari (86400000 ms)
app.use('/uploads', express.static(path.join((process as any).cwd(), 'public/uploads'), {
  maxAge: '1d', 
  etag: true,
  lastModified: true
}) as any);

// --- 4. SERVE FRONTEND ASSETS (CACHE BOLEH) ---
const frontendPath = path.join((process as any).cwd(), 'public/dist');
// Serve folder assets (js/css) dengan cache
app.use('/assets', express.static(path.join(frontendPath, 'assets'), {
  maxAge: '1y', // Cache lama karena nama file ada hash-nya
  immutable: true
}) as any);

// --- 5. GLOBAL NO-CACHE MIDDLEWARE (KHUSUS API & DATA DINAMIS) ---
// Semua kode di bawah baris ini TIDAK AKAN di-cache.
// Ini melindungi: /api/v1/* (Saldo, Profil, Transaksi)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// --- 6. API ROUTES ---
// Data keuangan masuk sini (Terkena dampak No-Cache di atas) -> AMAN
app.use('/api/v1', routes);

// --- 7. SERVE FRONTEND HTML (SPA FALLBACK) ---
// Sajikan index.html untuk route selain API
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendPath) as any); // Sisa file statis lainnya

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            // Index HTML jangan di-cache terlalu lama atau no-cache biar update versi cepat
            res.set('Cache-Control', 'no-cache'); 
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
}

// --- 8. ERROR HANDLER ---
app.use((err: any, req: any, res: any, next: any) => {
  return errorHandler(err, req, res, next);
});

export default app;
