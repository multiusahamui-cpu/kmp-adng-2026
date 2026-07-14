
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
// CSP whitelist berdasarkan host eksternal yang benar-benar dipakai app ini
// (dicek langsung di kode, bukan tebakan): Google Fonts, Leaflet CSS (unpkg),
// tile map OpenStreetMap, layanan geocoding/routing (Ride.tsx), gambar
// placeholder/avatar demo (constants.ts), Cloudflare Images (upload KTP/produk),
// embed YouTube (constants.ts). 'unsafe-inline' di style-src dibutuhkan karena
// React banyak pakai inline style prop -- risikonya jauh lebih rendah dari
// 'unsafe-inline' di script-src (yang sengaja TIDAK diizinkan di sini).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'", 'data:', 'blob:',
          'https://imagedelivery.net',
          'https://*.tile.openstreetmap.org',
          'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com', // APP_LOGO (src/constants.ts)
          'https://images.unsplash.com',
          'https://picsum.photos',
          'https://ui-avatars.com',
          'https://via.placeholder.com',
          'https://randomuser.me',
          'https://cdn-icons-png.flaticon.com',
          'https://www.transparenttextures.com',
        ],
        connectSrc: ["'self'", 'https://nominatim.openstreetmap.org', 'https://router.project-osrm.org'],
        frameSrc: ["'self'", 'https://www.youtube.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
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
// CORS whitelist khusus di sini, BUKAN global — static assets/HTML (di atas)
// tidak butuh CORS sama sekali (script/link/img tags tidak butuh izin CORS
// untuk dimuat), dan menerapkannya global sempat menyebabkan static assets
// ikut diblokir kalau Origin browser tidak persis cocok whitelist. Whitelist
// ini murni untuk klien cross-origin yang sah ke data: landing page terpisah,
// dsb (lihat CENTRALIZED_BACKEND.md). Bisa ditambah lewat env tanpa redeploy.
const defaultAllowedOrigins = [
  'https://kmp-adng.id',
  'https://landing.kmp-adng.id',
];
const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const devAllowedOrigins = process.env.NODE_ENV !== 'production'
  ? ['http://localhost:5173', 'http://localhost:3000']
  : [];
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins, ...devAllowedOrigins])];

const apiCors = cors({
  origin: (origin, callback) => {
    // Tanpa header Origin = same-origin request, curl/Postman, atau native
    // mobile HTTP client (bukan browser) — CORS memang tidak berlaku di sini.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  credentials: true,
});

// Data keuangan masuk sini (Terkena dampak No-Cache di atas) -> AMAN
app.use('/api/v1', apiCors as any, routes);

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
