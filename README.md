
# KMP-ADNG V2.0 - Koperasi Multi Pihak - Aset Digital Nusantara Garuda

![KMP-ADNG Logo](public/logo.png)

**KMP-ADNG (Koperasi Multi Pihak - Aset Digital Nusantara Garuda)** adalah sebuah *Super App* yang bertujuan untuk mendigitalisasi operasional koperasi, meningkatkan inklusi keuangan, dan memberdayakan ekonomi anggota serta pelaku UMKM melalui ekosistem digital yang terintegrasi.

Platform ini menggabungkan layanan keuangan (Simpan Pinjam, E-Wallet), perdagangan (Marketplace, PPOB, Pasar Grosir), logistik (K-Ride), dan manajemen organisasi (E-Voting, Komunitas) dalam satu atap.

---

## 🚀 Fitur Utama

### 📱 Member App (Frontend)
Aplikasi untuk anggota koperasi dengan fitur:
*   **Dompet Digital (KMP-ADNG Pay):** Top-up, Transfer sesama anggota, dan pembayaran QRIS.
*   **Marketplace:** Jual beli produk lokal antar anggota dan produk resmi koperasi (KMP-ADNG Mart).
*   **PPOB:** Pembayaran tagihan (PLN, PDAM, Pulsa/Data).
*   **Layanan Transportasi (K-Ride):** Ojek, Mobil, dan Kurir (K-Send).
*   **Pasar Grosir (B2B):** Lelang komoditas pertanian/perkebunan dari Produsen ke Distributor.
*   **Simpanan & Pembiayaan:** Cek saldo simpanan, estimasi SHU, dan pengajuan modal usaha (Tanggung Renteng).
*   **Komunitas:** Ruang Belajar (LMS), Chatting, dan E-Voting (RAT Online).
*   **Lapak Berjalan:** Tracking pedagang keliling di sekitar user.

### 🏢 Internal Portal (Staff & Management)
Dashboard khusus untuk pengelola koperasi:
*   **Admin:** Manajemen User, Approval Role (Mitra/Driver), Konfigurasi Sistem.
*   **Accounting:** Chart of Accounts (COA), Jurnal Umum, Buku Besar, Laporan Keuangan (Neraca/Laba Rugi).
*   **Treasury (Kasir):** Cash Management, Eksekusi Pembayaran, POS (Point of Sale).
*   **General Manager:** Monitoring Strategis, Approval Pembiayaan Besar, Analisa Wilayah.

---

## 🛠️ Tech Stack

### Frontend (Client)
*   **Framework:** React 19 + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Lucide Icons
*   **State Management:** React Hooks
*   **Maps:** Leaflet + OpenStreetMap
*   **Charts:** Recharts

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM
*   **Security:** JWT (Authentication), Bcrypt (Password & PIN Hash)
*   **Validation:** Zod

---

## ⚙️ Instalasi & Menjalankan Proyek

### Prasyarat
*   Node.js (v18+)
*   PostgreSQL Database (Local atau Cloud seperti Neon/Supabase)

### 1. Setup Backend
Masuk ke folder backend, install dependensi, dan setup database.

```bash
cd backend
npm install

# Buat file .env di dalam folder backend (Lihat contoh di bawah)
# Jalankan migrasi database
npm run db:push

# Isi database dengan data awal (Seed)
npm run db:seed

# Jalankan server
npm run dev
```

**Konfigurasi `.env` Backend:**
```env
PORT=3000
DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
JWT_SECRET="rahasia_negara_kmp_adng_v2"

# Opsional -- daftar origin cross-origin yang diizinkan CORS, dipisah koma.
# Kosongkan untuk pakai default (domain utama + landing page, lihat backend/src/app.ts).
# Web App utama tidak butuh ini karena sudah same-origin (single-domain deploy).
# CORS_ALLOWED_ORIGINS=https://landing.kmp-adng.id,https://partner-lain.id
```

### 2. Setup Frontend
Di terminal baru (root folder), jalankan frontend.

```bash
# Di root folder proyek
npm install
npm run dev
```

Akses aplikasi di `http://localhost:5173` (Vite dev server, otomatis proxy `/api` ke backend di `localhost:3000`).

### 3. Build & Jalankan Mode Production (Single Domain)
Aplikasi ini adalah **monorepo single-domain**: hasil build frontend masuk ke `backend/public/dist`, lalu satu proses Express yang sama menyajikan frontend *dan* API (`/api/v1`) dari satu port/domain. Tidak perlu deploy dua tempat terpisah.

```bash
# Dari root folder proyek — satu rangkaian perintah untuk build & jalankan semuanya
npm install     # install frontend + backend (lewat hook postinstall)
npm run build   # build frontend (-> backend/public/dist) + compile backend TypeScript
npm start       # jalankan satu proses Express (frontend + /api/v1)
```

Detail strategi deploy ke platform PaaS (Render/Railway/cPanel Node App, dsb) ada di [CICD.md](CICD.md).

### 4. Quality Checks
Perintah pengecekan kualitas kode sebelum commit/merge:

```bash
npm run lint    # ESLint
npm run check   # Type-check frontend + backend (tsc --noEmit)
npm run test    # Vitest (saat ini baru ada test di backend)
```

---

## 🔐 Arsitektur Keamanan & Logic

### 1. Centralized Backend & Single-Domain Deploy
Sistem menggunakan satu database terpusat (`users`, `wallets`, `transactions`) yang memungkinkan integrasi seamless antara Website Official, Web App Member, dan Internal Portal. Satu akun untuk semua platform.

Web App (`/src`) dan Backend API (`/backend`) di-deploy sebagai **satu proses Node.js di satu domain** — bukan dua deployment terpisah seperti versi sebelumnya. Detail lengkapnya ada di [CICD.md](CICD.md) dan [CENTRALIZED_BACKEND.md](CENTRALIZED_BACKEND.md).

### 2. PIN Transaction Security
*   **Server-Side Validation:** Validasi PIN transaksi **wajib** dilakukan di sisi server (`verifyPin` middleware). Frontend tidak boleh membandingkan PIN dengan local storage.
*   **Race Condition Fix:** Frontend menggunakan mekanisme *Execution Lock* (`useRef`) pada komponen `PinModal` untuk mencegah double-submit transaksi saat jaringan lambat atau user menekan tombol berulang kali.

### 3. Device Fingerprinting (Planned)
Sistem dirancang untuk mendeteksi login dari perangkat baru dan meminta verifikasi OTP (Email/WA) sebelum memberikan akses token JWT penuh.

---

## 📂 Struktur Proyek

```
/
├── backend/                 # Backend API (Express + Drizzle) -- juga serve frontend saat production
│   ├── src/
│   │   ├── controllers/     # Logic Handler
│   │   ├── db/              # Schema & Connection
│   │   ├── middleware/      # Auth, Role, Upload
│   │   ├── routes/          # API Endpoints
│   │   ├── app.ts           # Serve API (/api/v1) + static frontend + SPA fallback
│   │   └── **/*.test.ts     # Vitest unit tests
│   ├── drizzle/             # Migration files
│   ├── vitest.config.ts     # Konfigurasi Vitest (backend)
│   └── public/dist/         # Hasil build frontend (auto-generated saat `npm run build`, jangan commit)
│
├── src/                     # Frontend (React)
│   ├── components/          # Reusable UI (Sidebar, Navbar, Modal)
│   ├── pages/                # Halaman Aplikasi
│   │   ├── Admin...          # Halaman Internal
│   │   ├── ...                # Halaman Member
│   ├── services/             # API Calls (Axios)
│   └── types.ts              # TypeScript Interfaces
├── vite.config.ts           # build.outDir = backend/public/dist
│
├── CICD.md                  # Strategi build & deploy (monorepo single-domain)
├── CENTRALIZED_BACKEND.md   # Panduan integrasi eksternal ke backend
└── reference.md             # Catatan Teknis & Architectural Decisions
```

---

## 🤝 Kontribusi

Proyek ini dikembangkan dengan filosofi **"Dari Anggota, Oleh Anggota, Untuk Anggota"**.
Pastikan untuk mengikuti *Coding Guidelines* yang tertera pada prompt awal (khususnya penggunaan `@google/genai` jika mengintegrasikan fitur AI di masa depan).

**Current Version:** 2.0.0-Beta
