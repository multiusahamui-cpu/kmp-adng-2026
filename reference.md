
# KMP-ADNG V2.0 - Technical Reference & Architectural Decisions

Dokumen ini berisi catatan teknis penting, solusi atas masalah kritis (Bug Fixes), dan keputusan arsitektur sistem untuk pengembangan KMP-ADNG V2.0.

---

## 1. Critical Bug Fix: Race Condition pada Transaksi (PIN)

### Masalah
Pada fitur Ganti PIN atau Transaksi, server mencatat log aneh:
1.  Request pertama: **200 OK** (Berhasil)
2.  Request kedua (milidetik kemudian): **400 Bad Request** (Gagal)
3.  Request ketiga: **400 Bad Request** (Gagal)

**Penyebab:**
React `useEffect` pada komponen `PinModal` tereksekusi berkali-kali dalam waktu sangat singkat (karena *render cycle* React atau input cepat). Frontend mengirim request ganda sebelum request pertama selesai.
*   Request 1: Mengubah PIN di DB (PIN Lama Valid -> Ganti Baru).
*   Request 2: Membawa PIN Lama yang sama, tapi karena DB sudah berubah di Request 1, PIN Lama dianggap SALAH oleh server.

### Solusi: Execution Lock (Mutex Pattern)
Implementasi `useRef` sebagai *flag* pemblokir eksekusi ganda.

```typescript
// Pattern pada PinModal.tsx
const isProcessing = useRef(false);

useEffect(() => {
    if (pin.length === 6) {
        // CEK KUNCI: Jika sedang memproses, berhenti disini.
        if (isProcessing.current) return;
        
        // KUNCI PINTU: Set flag true segera.
        isProcessing.current = true;

        // Eksekusi Logika API...
        api.post('/endpoint', payload)
           .finally(() => {
               // BUKA KUNCI: Hanya jika terjadi error atau reset state
               isProcessing.current = false; 
           });
    }
}, [pin]);
```

---

## 2. Security Architecture: Server-Side Validation

### Masalah Lama (Frontend Validation)
Sebelumnya, validasi PIN dilakukan di Frontend dengan membandingkan input user dengan `storedPin` yang ada di memori/localStorage.
*   **Risiko:** Jika user mengganti PIN di perangkat lain atau via Admin, data di localStorage perangkat ini menjadi basi (*stale*). Transaksi akan gagal terus menerus padahal PIN input benar.
*   **Risiko Keamanan:** Menyimpan hash PIN atau PIN asli di browser/localStorage sangat berbahaya (XSS Attack).

### Arsitektur Baru (Server-Side)
1.  **Frontend:** Hanya bertugas sebagai "Input Interface". Tidak boleh ada logika validasi kebenaran PIN di JavaScript.
2.  **Transport:** Frontend mengirim PIN (via HTTPS) ke endpoint backend (misal: `/api/v1/wallet/transfer`).
3.  **Backend:**
    *   Menerima request.
    *   Mengambil hash PIN user dari Database (PostgreSQL).
    *   Menggunakan `bcrypt.compare()` untuk memvalidasi.
    *   Jika valid, transaksi diproses. Jika tidak, return `401 Unauthorized`.

---

## 3. Strategi Integrasi: Centralized Backend

Untuk mendukung ekosistem KMP-ADNG (Website Official, Web App Member, Mobile App Android/iOS), kita menggunakan arsitektur **Shared Database**.

### Topologi
*   **Database (PostgreSQL):** Satu sumber kebenaran (*Single Source of Truth*). Tabel `users`, `wallets`, `transactions` dipakai bersama.
*   **Backend API (Express.js):** Satu pintu gerbang logic.
    *   URL: `https://api.kmp-adng.id/v1`
*   **Frontend Clients:**
    1.  **Website Official (Landing Page):** Menggunakan API `/auth/register` untuk pendaftaran anggota baru.
    2.  **Web App (Dashboard):** Menggunakan API lengkap untuk transaksi.
    3.  **Mobile App:** Menggunakan API yang sama persis dengan Web App.

### Keuntungan
User yang mendaftar di Website Official tidak perlu mendaftar ulang di Aplikasi. Cukup login menggunakan kredensial yang sama.

---

## 4. Device Security & Fingerprinting

Karena browser modern memblokir akses ke **MAC Address** demi privasi, kita menggunakan strategi **Device Fingerprinting** untuk keamanan akun.

### Struktur Tabel `user_devices` (Rencana Implementasi)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK ke Users |
| `device_hash` | String | Unik (Generated dari User Agent + Screen Res + dll) |
| `ip_address` | String | IP Terakhir Login |
| `is_trusted` | Boolean | True jika sudah lolos OTP |
| `last_login` | Timestamp | Waktu akses terakhir |

### Logic Flow (Login)
1.  User Login (Email + Password).
2.  Backend mengecek `req.headers['user-agent']` dan IP Address.
3.  Cek di tabel `user_devices`: Apakah user ini pernah login dengan fingerprint ini?
    *   **Ya (Trusted):** Berikan Token JWT. Login Sukses.
    *   **Tidak (New Device):**
        *   Generate OTP.
        *   Kirim ke WA/Email User.
        *   Return response `202 Accepted` (Require OTP).
        *   Frontend menampilkan form OTP.
        *   Jika OTP valid -> Simpan device ke DB -> Berikan Token JWT.

---

## 5. Migrasi ke Mobile (Android/iOS)

Poin penting saat mengonversi kode React ini ke React Native atau Capacitor:

1.  **Status Code HTTP adalah Nyawa:**
    *   Pantau console server.
    *   **400:** Salah kirim format data dari HP.
    *   **401:** Token JWT hilang/expired (Masalah penyimpanan `SecureStore` vs `localStorage`).
    *   **500:** Server error (Bug di backend).
2.  **Storage:**
    *   Web: `localStorage`.
    *   Mobile: Gunakan `AsyncStorage` atau `SecureStore` (untuk Token/PIN). Jangan gunakan localStorage browser di WebView karena bisa terhapus oleh OS saat memori penuh.
