
# KMP-ADNG V2.0 - Koperasi Multi Pihak - Aset Digital Nusantara Garuda

![KMP-ADNG Logo](https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/fba7ced1-9ffb-4a18-80e5-5c1b4b90d37b-tizjYLMSctALX9I89ogUSs9Y1s2Pqr)

**KMP-ADNG (Koperasi Multi Pihak - Aset Digital Nusantara Garuda)** adalah sebuah *Super App* yang bertujuan untuk mendigitalisasi operasional koperasi adat, meningkatkan inklusi keuangan, dan memberdayakan ekonomi anggota melalui ekosistem digital yang terintegrasi.

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
*   **Framework:** React 18 + Vite
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
PORT=5000
DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
JWT_SECRET="rahasia_negara_kmp_adng_v2"
```

### 2. Setup Frontend
Di terminal baru (root folder), jalankan frontend.

```bash
# Di root folder proyek
npm install
npm run dev
```

Akses aplikasi di `http://localhost:5173`.

---

## 🔐 Arsitektur Keamanan & Logic

### 1. Centralized Backend
Sistem menggunakan satu database terpusat (`users`, `wallets`, `transactions`) yang memungkinkan integrasi seamless antara Website Official, Web App Member, dan Internal Portal. Satu akun untuk semua platform.

### 2. PIN Transaction Security
*   **Server-Side Validation:** Validasi PIN transaksi **wajib** dilakukan di sisi server (`verifyPin` middleware). Frontend tidak boleh membandingkan PIN dengan local storage.
*   **Race Condition Fix:** Frontend menggunakan mekanisme *Execution Lock* (`useRef`) pada komponen `PinModal` untuk mencegah double-submit transaksi saat jaringan lambat atau user menekan tombol berulang kali.

### 3. Device Fingerprinting (Planned)
Sistem dirancang untuk mendeteksi login dari perangkat baru dan meminta verifikasi OTP (Email/WA) sebelum memberikan akses token JWT penuh.

---

## 📂 Struktur Proyek

```
/
├── backend/                # Backend API (Express + Drizzle)
│   ├── src/
│   │   ├── controllers/    # Logic Handler
│   │   ├── db/             # Schema & Connection
│   │   ├── middleware/     # Auth, Role, Upload
│   │   └── routes/         # API Endpoints
│   └── drizzle/            # Migration files
│
├── src/                    # Frontend (React)
│   ├── components/         # Reusable UI (Sidebar, Navbar, Modal)
│   ├── pages/              # Halaman Aplikasi
│   │   ├── Admin...        # Halaman Internal
│   │   ├── ...             # Halaman Member
│   ├── services/           # API Calls (Axios)
│   └── types.ts            # TypeScript Interfaces
│
└── reference.md            # Catatan Teknis & Architectural Decisions
```

---

## 🤝 Kontribusi

Proyek ini dikembangkan dengan filosofi **"Dari Anggota, Oleh Anggota, Untuk Anggota"**.
Pastikan untuk mengikuti *Coding Guidelines* yang tertera pada prompt awal (khususnya penggunaan `@google/genai` jika mengintegrasikan fitur AI di masa depan).

**Current Version:** 2.0.0-Beta
