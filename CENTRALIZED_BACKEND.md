
# Centralized Backend Solution Architecture

Dokumen ini berfungsi sebagai referensi teknis untuk mengintegrasikan proyek eksternal (Website Profil, Mobile Apps, 3rd Party Systems) agar dapat menggunakan **Database** dan **API Endpoint** yang sama dengan KMP-ADNG Super App.

Tujuannya adalah menciptakan *Single Source of Truth* (Satu Sumber Kebenaran) untuk data User, Wallet, dan Transaksi.

---

## 1. Topologi Sistem

KMP-ADNG Web App (`/src`) dan Backend API (`/backend`) di-deploy sebagai **satu proses Node.js di satu domain** (lihat [CICD.md](CICD.md)) — Express menyajikan frontend *dan* `/api/v1` sekaligus, jadi Web App memanggil API lewat relative path (same-origin), bukan domain terpisah.

Proyek eksternal (Mobile App, Landing Page, Internal Portal lain) tetap terhubung ke Backend yang sama itu, tapi secara cross-origin lewat domain publik aplikasi.

```mermaid
graph TD
    DB[(PostgreSQL Database)]
    API[Backend API (Express + Drizzle) -- serve juga Web App]
    
    API -->|Read/Write| DB
    
    WebMember[KMP-ADNG Web App] -->|same-origin /api/v1| API
    MobileApp[Android / iOS] -->|HTTPS /api/v1| API
    LandingPage[Official Website] -->|HTTPS /api/v1| API
    InternalPanel[Internal Dashboard] -->|HTTPS /api/v1| API
```

### Konfigurasi Koneksi
Untuk proyek eksternal (bukan Web App utama, yang sudah same-origin), gunakan konfigurasi berikut:

*   **API Base URL:** `https://kmp-adng.id/api/v1` (Production, domain tunggal) atau `http://localhost:3000/api/v1` (Dev).
*   **Database Connection String:** Gunakan string yang sama dengan `.env` di backend KMP-ADNG jika proyek tersebut adalah *service* internal yang butuh akses langsung (Direct DB Access).

---

## 2. Shared Core Objects (Model Data Utama)

Agar proyek lain dapat "mengenali" objek utama KMP-ADNG, pastikan struktur data (Interface/Type) yang digunakan selaras dengan skema Drizzle berikut.

### A. User Object (`users` table)
Setiap user memiliki satu identitas unik (UUID) yang digunakan di seluruh platform.

```typescript
export interface SharedUser {
  id: string;           // UUID (Primary Key)
  name: string;         // Nama Lengkap
  email?: string;       // Opsional, Unique
  phone: string;        // Wajib, Unique (Login Identifier)
  password: string;     // Bcrypt Hash (Jangan di-expose ke frontend)
  
  // Role Management
  roles: string[];      // Array: ['member', 'admin', 'merchant', etc.]
  
  // Status
  status: 'active' | 'pending' | 'suspended';
  
  // Relasi Logis
  referralCode?: string;
  ktaId?: string;       // Nomor Anggota Koperasi
}
```

### B. Wallet Object (`wallets` table)
Setiap `User` **WAJIB** memiliki satu record `Wallet`. Jika Anda membuat User baru dari proyek luar (misal: Register via Landing Page), Anda **harus** membuatkan entry wallet juga.

```typescript
export interface SharedWallet {
  id: string;           // UUID
  userId: string;       // Foreign Key ke Users.id
  balance: number;      // Saldo Utama (Decimal di DB, Number di App)
  savings: number;      // Simpanan Koperasi
}
```

### C. Transaction Object (`transactions` table)
Semua mutasi saldo dicatat di sini.

```typescript
export interface SharedTransaction {
  id: string;
  walletId: string;     // Foreign Key ke Wallets.id
  type: string;         // 'topup', 'transfer', 'purchase', 'ppob'
  amount: number;
  description: string;
  referenceId?: string; // ID eksternal (misal: ID Order e-commerce lain)
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}
```

---

## 3. Strategi Integrasi (How-To)

### Skenario 1: Pendaftaran User dari Website Luar (Landing Page)
Jika Anda ingin membuat form registrasi di website profil perusahaan yang langsung terintegrasi ke aplikasi:

**Endpoint:** `POST /auth/register`

**Payload:**
```json
{
  "name": "Budi Santoso",
  "phone": "08123456789",
  "password": "password123",
  "email": "budi@example.com" // Opsional
}
```

**Mekanisme Backend (Otomatis):**
1.  Backend akan membuat row di tabel `users`.
2.  Backend akan **otomatis** membuat row di tabel `wallets` dengan saldo 0.
3.  Backend mengembalikan `token` (JWT) yang bisa langsung digunakan user untuk login ke Web App tanpa daftar ulang.

### Skenario 2: Login dari Mobile App
Gunakan endpoint yang sama dengan Web App. Token JWT yang dihasilkan bersifat universal.

**Endpoint:** `POST /auth/login`

**Payload:**
```json
{
  "identifier": "08123456789", // Bisa No HP atau Email
  "password": "password_user"
}
```

**Response:**
Simpan `data.token` di `SecureStore` (Mobile) atau `localStorage` (Web). Gunakan token ini pada header `Authorization: Bearer <token>` untuk setiap request selanjutnya.

### Skenario 3: Menampilkan Produk KMP-ADNG di Website Lain
Jika ingin menampilkan produk marketplace di website profil:

**Endpoint:** `GET /marketplace/products` (Public Access)
Tidak memerlukan token Auth. Response berisi array produk dengan detail harga, gambar, dan kategori.

---

## 4. Keamanan & Validasi (Server-Side)

### CORS (Cross-Origin Resource Sharing)
Web App utama (`/src`) tidak butuh entri CORS sama sekali — sejak single-domain deploy (lihat `CICD.md`), Web App dan API satu origin. Whitelist di `backend/src/app.ts` ini khusus untuk klien cross-origin: proyek eksternal (Website Profil terpisah, dsb) yang mengakses API dari domain lain.

Default-nya sudah mencakup domain utama & landing page. Untuk menambah domain lain tanpa ubah kode, set environment variable `CORS_ALLOWED_ORIGINS` (dipisah koma) di server:

```env
CORS_ALLOWED_ORIGINS=https://partner-lain.id,https://domain-lainnya.id
```

Request tanpa header `Origin` (server-to-server, mobile app native HTTP client, curl) selalu diizinkan — CORS memang cuma berlaku untuk browser cross-origin JS, bukan mekanisme otentikasi.

### PIN Validation
Untuk transaksi finansial dari platform manapun, validasi PIN dilakukan di Server. Jangan pernah memvalidasi PIN di sisi Client (Frontend).

**Endpoint:** `POST /wallet/transfer` (Contoh)
**Header:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "amount": 50000,
  "targetPhone": "08987654321",
  "pin": "123456" // PIN dikirim ke server untuk diverifikasi bcrypt
}
```

---

## 5. Shared Type Library (Rekomendasi)

Untuk menjaga konsistensi tipe data antara Frontend, Backend, dan Proyek Eksternal, disarankan menggunakan **Monorepo** atau mempublikasikan package NPM private `@kmp-adng/types`.

Jika tidak memungkinkan, salin file `src/types.ts` dari proyek ini ke folder `src/types` di proyek baru Anda. Pastikan untuk selalu memperbarui file tersebut jika ada perubahan skema database.

---

**Catatan:**
Pastikan setiap insert data ke database (terutama `users` dan `wallets`) melalui API Endpoint yang sudah disediakan untuk menjaga integritas relasi data. Hindari *direct insert* ke database kecuali Anda memahami struktur Foreign Key sepenuhnya.
