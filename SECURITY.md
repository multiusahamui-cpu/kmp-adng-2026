
# Security Risk Register - KMP-ADNG

Catatan hasil review keamanan terhadap kondisi kode saat ini (bukan pending changes). Setiap temuan berisi lokasi, dampak konkret, dan rekomendasi. Dipakai sebagai checklist untuk fase perbaikan ("factoring") berikutnya — centang `[x]` setelah item diperbaiki dan dicek ulang.

Urutan berdasarkan prioritas (paling mendesak duluan), bukan berdasarkan kapan ditemukan.

---

## 1. [x] Tidak ada rate limiting — brute force PIN/login/OTP

**Severity:** High — **Fixed**

**Lokasi:** `backend/src/app.ts`, seluruh route auth (`backend/src/routes/auth.routes.ts`), `backend/src/middleware/pin.middleware.ts`. Tidak ada `express-rate-limit` (atau sejenis) di `backend/package.json`.

**Kenapa berbahaya:**
- PIN transaksi cuma 6 digit numerik (~1 juta kombinasi). Tanpa throttle/lockout, endpoint yang dilindungi `verifyPin` bisa di-brute-force sampai tembus — ini gerbang ke transaksi uang anggota.
- Endpoint `login` dan `verifyLoginOtp` (`backend/src/controllers/auth.controller.ts`) juga tidak dibatasi — password & OTP bisa di-brute-force dari IP manapun tanpa hambatan.

**Rekomendasi:**
- Pasang `express-rate-limit` minimal di 3 titik: `/auth/login`, `/auth/verify-login-otp`, dan endpoint apa pun yang lewat `verifyPin`.
- Tambahkan lockout/counter di level user (bukan cuma IP) untuk PIN — misal: 5x salah, kunci 15 menit — supaya tidak bisa dielakkan dengan ganti IP/proxy.

**Implementasi:**
- `backend/src/utils/attemptLimiter.ts` — tracker in-memory yang dikunci per **identitas** (identifier login, atau `user.id` untuk PIN/OTP), bukan per-IP/endpoint. Cuma percobaan **gagal** yang dihitung; sukses = reset counter. Kunci sementara (bukan permanen), auto-lepas setelah `lockoutMs`. Ditest di `attemptLimiter.test.ts` (5 test, termasuk kasus auto-unlock pakai fake timers).
- Dipasang di: `login` & `verifyLoginOtp` (key: identifier/userId, 5x gagal → kunci 15 menit), `verifyKycOtp` (key: `req.user.id`), dan `verifyPin` middleware (key: `req.user.id`).
- Response saat terkunci: **429** (bukan 403) + header `Retry-After` (detik), supaya frontend bisa tampilkan "coba lagi dalam X menit" bukan pesan generik yang menakuti pengguna asli.
- Lapisan kedua: `authIpLimiter` (express-rate-limit) di `auth.routes.ts`, 30 request/10 menit per IP, cuma di `/login` & `/verify-login-otp` — longgar, cuma untuk anti-scanning kasar dari satu sumber, bukan andalan utama (andalan utama adalah limiter per-identitas di atas).

**Keterbatasan yang diketahui (in-memory, single-instance):**
- State limiter hidup di memory proses Node — reset kalau server restart, dan tidak ter-share kalau nanti scale ke >1 instance di belakang load balancer. Untuk deploy single-process saat ini (lihat `CICD.md`) ini cukup; kalau nanti horizontal-scale, pindahkan ke Redis/tabel DB.
- **OTP login & KYC saat ini masih pakai `DEFAULT_OTP = '123456'` hardcoded** (`auth.controller.ts`, `auth.service.ts`) — belum ada integrasi WA gateway sungguhan (`requestKycOtp` cuma komentar placeholder). Rate limiting di endpoint OTP ini tetap berguna sebagai defense-in-depth, tapi nilai proteksinya terbatas selama OTP-nya masih nilai statis yang diketahui semua orang yang baca kode/dokumentasi ini. **Ini temuan terpisah yang perlu diselesaikan sebelum go-live** — lihat item baru #9 di bawah.
- Fitur notifikasi WA/email ke pemilik akun saat ada percobaan gagal berulang (yang dibahas saat diskusi) **belum diimplementasikan** — belum ada WA gateway terpasang di kode untuk dikirimi pesan. Bisa ditambahkan begitu gateway-nya ada.

---

## 2. [x] CORS terbuka untuk semua origin

**Severity:** Medium-High — **Fixed**

**Lokasi:** `backend/src/app.ts:17` — `app.use(cors())` tanpa opsi apa pun.

**Kenapa berbahaya:**
- Default `cors()` = `Access-Control-Allow-Origin: *`. Siapa pun bisa memanggil API dari domain manapun.
- `CENTRALIZED_BACKEND.md` sudah mendokumentasikan pola `allowedOrigins` whitelist sebagai *rekomendasi* — tapi itu cuma contoh kode di dokumen, **tidak pernah benar-benar diimplementasikan** di `app.ts`. Dokumentasi dan kenyataan kode tidak sinkron.
- Dampak konkret naik kalau digabung dengan temuan #3 (CSP mati) — origin manapun + celah XSS = eksploitasi lebih gampang.

**Rekomendasi:**
- Implementasikan whitelist origin sesuai yang sudah didokumentasikan di `CENTRALIZED_BACKEND.md` (domain Web App, domain landing page resmi, localhost untuk dev). Jangan biarkan wildcard di production.

**Implementasi:**
- `backend/src/app.ts` — origin sekarang dicek terhadap whitelist (`kmp-adng.id`, `landing.kmp-adng.id`, plus `localhost:5173`/`:3000` otomatis kalau bukan `NODE_ENV=production`). Bisa ditambah lewat env `CORS_ALLOWED_ORIGINS` (dipisah koma) tanpa perlu redeploy kode — didokumentasikan di `README.md` dan `CENTRALIZED_BACKEND.md`.
- **Bug yang ketemu & dibenerin saat verifikasi (item #3):** implementasi awal pasang CORS check ini **global** (di semua route, termasuk static assets `/assets/*`). Ternyata browser (Chromium, kemungkinan besar browser lain juga) memang mengirim header `Origin` untuk request `<script src>`/`<link>` walau same-origin — kalau origin itu tidak persis cocok whitelist statis, seluruh JS/CSS bundle ikut ke-block (500), app jadi blank putih total. Dites & ketahuan lewat screenshot Playwright terhadap production build. **Fix:** CORS whitelist dipindah supaya cuma berlaku di `app.use('/api/v1', apiCors, routes)` — static assets/HTML sama sekali tidak lewat CORS check (memang tidak butuh, `<script>`/`<link>`/`<img>` tidak perlu izin CORS untuk dimuat). Sudah diverifikasi ulang: halaman render normal, tidak ada request yang gagal.
- Request tanpa header `Origin` (server-to-server, mobile app native client, curl) tetap diizinkan — itu bukan skenario yang CORS proteksi (CORS cuma berlaku untuk browser cross-origin JS).
- Web App utama sekarang same-origin (single-domain deploy) jadi tidak lewat CORS check sama sekali — whitelist ini murni untuk klien eksternal yang genuinely cross-origin.
- `CENTRALIZED_BACKEND.md` §4 diupdate supaya contoh kodenya cocok dengan implementasi asli.

---

## 3. [x] Content-Security-Policy dimatikan total

**Severity:** Medium-High — **Fixed**

**Lokasi:** `backend/src/app.ts:19-22` — `helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } })`.

**Kenapa berbahaya:**
- CSP adalah lapisan pertahanan utama terhadap XSS (membatasi script apa yang boleh jalan di halaman). Dimatikan total = lapisan ini hilang.
- Dampaknya lebih besar dari biasanya di app ini karena **JWT disimpan di `localStorage`** (`src/services/api.ts`), bukan httpOnly cookie — kalau ada celah XSS, token bisa langsung dibaca & dicuri oleh script jahat, bukan cuma cookie session yang biasanya lebih terproteksi.

**Rekomendasi:**
- Aktifkan CSP dengan whitelist yang sesuai kebutuhan riil app (Google Fonts, Leaflet tile server, Cloudflare Images, dll — semua sudah kelihatan dipakai di `index.html`/kode). Ini butuh testing supaya tidak mematahkan fitur yang sah, tapi jangan dibiarkan `false` selamanya.

**Implementasi:**
- **Prasyarat yang ketemu saat mengerjakan ini:** `index.html` ternyata masih memuat Tailwind lewat CDN (`cdn.tailwindcss.com`) + config inline, dan `importmap` yang memetakan `react`/`express`/`pg`/`multer`/dll ke `esm.sh` — sisa scaffold lama. `src/index.css` bahkan punya komentar eksplisit `/* Removed @tailwind directives as we are using CDN */`, artinya CDN itu **satu-satunya** sumber Tailwind yang aktif, bukan dead code. Kalau CSP diaktifkan dengan dua script inline itu masih ada, terpaksa pakai `'unsafe-inline'` di `script-src` — nyaris menghilangkan manfaat CSP untuk XSS. Atas persetujuan user: dikembalikan dulu `@tailwind base/components/utilities` di `src/index.css` (CSS build naik dari 0.9KB → 102KB, tanda Tailwind asli sudah ter-generate PostCSS), baru CDN + importmap dihapus dari `index.html`.
- `backend/src/app.ts` — CSP aktif dengan whitelist eksplisit per directive (`script-src`, `style-src`, `font-src`, `img-src`, `connect-src`, `frame-src`), disusun dari hasil `grep` semua host eksternal yang benar-benar direferensikan di `src/` (Google Fonts, Leaflet/unpkg, tile OpenStreetMap, Nominatim/OSRM buat fitur Ride, Cloudflare Images, logo app di Vercel Blob Storage, beberapa host gambar placeholder/demo, embed YouTube). **`script-src` tidak pakai `'unsafe-inline'` sama sekali** — ini baru bisa dicapai karena pembersihan `index.html` di atas.
- **Verifikasi nyata, bukan cuma baca kode:** build production dijalankan sungguhan, di-screenshot pakai Playwright (headless Chromium) terhadap server yang benar-benar hidup. Proses ini menangkap 2 bug nyata sebelum sempat ke user:
  1. CORS yang dipasang global di item #2 ternyata ikut memblokir static assets (`/assets/*.js`/`.css`) karena browser mengirim header `Origin` bahkan untuk request same-origin — app jadi blank putih total. **Fix:** CORS dipindah supaya cuma berlaku di `/api/v1`, bukan global (detail di item #2).
  2. CSP awal lupa memasukkan host logo app (`usdozf7pplhxfvrl.public.blob.vercel-storage.com`, dipakai di `src/constants.ts` sebagai `APP_LOGO`) — logo gagal muncul sampai ditambahkan ke `img-src`.
- Setelah kedua fix, halaman login di-screenshot ulang: styling & logo tampil normal, tidak ada CSP violation atau request gagal di console.

---

## 4. [ ] Data pribadi spesifik (NIK + foto KTP) — kewajiban UU PDP

**Severity:** High (regulasi, bukan cuma teknis)

**Lokasi:** `backend/src/db/schema.ts` (`nik`, `ktpPhoto`, `selfiePhoto` di tabel `users`), alur KYC di `backend/src/controllers/auth.controller.ts` (`uploadKyc`).

**Kenapa penting:**
- NIK + foto KTP masuk kategori **data pribadi spesifik** menurut UU No. 27/2022 (UU PDP) — level kewajiban lebih tinggi dari data pribadi umum: dasar pemrosesan/consent yang jelas & tercatat, hak akses/koreksi/hapus untuk pemilik data, kewajiban notifikasi kalau terjadi kebocoran.
- `PRIVACY.md` sudah mengumumkan pengumpulan NIK/KTP/Selfie (bagus, sudah transparan ke pengguna) dan mengklaim *"Semua data sensitif (Password, PIN) dienkripsi... standar industri (Bcrypt)"` — **tapi klaim ini cuma bicara Password/PIN, tidak menyebut NIK/foto KTP sama sekali.** Berdasarkan schema, NIK tersimpan sebagai `varchar` biasa (bukan di-hash — memang tidak bisa di-hash karena perlu dibaca ulang untuk verifikasi, tapi idealnya di-encrypt-at-rest), dan `ktpPhoto` kemungkinan besar cuma URL/path biasa.
- Ini bukan cuma soal teknis: ada gap antara **apa yang dijanjikan ke pengguna** di kebijakan privasi vs **apa yang benar-benar diimplementasikan** di kode — potensi masalah kepatuhan.

**Rekomendasi (butuh diskusi lebih dalam, bukan quick-fix):**
- Cek apakah NIK perlu encryption-at-rest (bukan cuma TLS in-transit) mengingat sensitivitasnya.
- Pastikan retensi & penghapusan data KYC konsisten dengan `PRIVACY.md` §5 (hak dilupakan vs kewajiban simpan data transaksi 5-10 tahun).
- Verifikasi ulang siapa saja yang punya akses baca NIK/KTP di kode (role `admin`/`super_admin`/`general_manager` sejauh yang saya lihat di `admin.routes.ts` — perlu di-audit lebih lengkap per endpoint).

---

## 5. [x] PIN hash sempat lewat jalur yang rapuh di `getProfile`

**Severity:** Low-Medium — **Fixed**

**Lokasi:** `backend/src/controllers/user.controller.ts` — fungsi `getProfile`.

**Kenapa perlu diwaspadai:**
```ts
const [user] = await db.select({
    // ...
    pinResetStatus: users.pin   // <- ini SELECT hash bcrypt PIN asli, ditaruh di key "pinResetStatus"
}).from(users).where(eq(users.id, req.user.id));

const safeUser = {
    ...user,
    transactionPin: user.pinResetStatus ? 'SET' : undefined,
    pinResetStatus: undefined   // <- baru dihapus di sini
};
```
Saat ini **tidak bocor ke response** karena `res.json()` pakai `JSON.stringify`, yang otomatis membuang key bernilai `undefined`. Tapi ini rapuh: kalau nanti ada yang `console.log(safeUser)` untuk debugging, atau serialisasi response berubah (logger lain, caching layer, dsb), hash bcrypt PIN bisa ke-expose. Kode ini "aman secara kebetulan", bukan secara desain.

**Rekomendasi:**
- Jangan pernah `SELECT` kolom `pin`/`password` ke variabel yang dicampur dengan objek response. Pakai query terpisah yang cuma mengembalikan boolean (`sql\`${users.pin} IS NOT NULL\` as hasPin`), atau `.select({...})` yang dari awal tidak menyertakan kolom hash sama sekali.

**Implementasi:**
- `getProfile` sekarang pakai `sql<boolean>\`${users.pin} IS NOT NULL\`` langsung di `.select()` — hash bcrypt PIN tidak pernah masuk ke variabel JS sama sekali, jadi tidak ada lagi risiko "aman secara kebetulan". Bentuk response ke frontend (`transactionPin: 'SET' | undefined`) tidak berubah — sudah dicek konsumennya di `src/pages/Settings.tsx`, `src/components/settings/SecuritySection.tsx`, `src/pages/ScanQR.tsx`.

---

## 6. [x] JWT umur 7 hari tanpa refresh/rotation/revocation

**Severity:** Medium — **Fixed**

**Lokasi:** `backend/src/utils/jwt.ts:7` — `expiresIn: '7d'`.

**Kenapa berbahaya:**
- Kalau token bocor (misal lewat XSS di temuan #3), token tetap valid sampai 7 hari — tidak ada mekanisme blacklist/revoke di server. Dikonfirmasi: `logout()` di `src/services/auth.service.ts:112` cuma `localStorage.clear()` — tidak ada panggilan ke server untuk invalidasi token. Token aslinya tetap sah kalau dipakai ulang lewat request manual (mis. lewat Postman/curl) sampai masa berlaku 7 hari habis, walau user sudah "logout".

**Rekomendasi:**
- Pertimbangkan access token berumur pendek (mis. 15-60 menit) + refresh token terpisah, atau minimal tabel session/device (`user_devices` sudah direncanakan di `reference.md` §4) yang bisa dipakai untuk revoke token tertentu.

**Implementasi (pendekatan `tokenVersion`, bukan full refresh-token rotation):**
- **Keputusan bareng user:** umur token diperpendek `7d` → `3d` (`backend/src/utils/jwt.ts`); dan skema `tokenVersion` dipilih ketimbang refresh-token penuh karena jauh lebih kecil blast radius-nya (tidak perlu ubah alur auth di frontend) sambil tetap menutup celah utama: logout yang sebelumnya tidak benar-benar apa-apa di server.
- **Skema:** kolom `token_version` (integer, default 0) ditambahkan ke tabel `users` (`backend/src/db/schema.ts`) — migration `drizzle/0004_loose_komodo.sql`, **sudah di-push ke database live** (diverifikasi langsung lewat query `information_schema.columns`).
- **Alur:** `tokenVersion` user ikut ditandatangani sebagai claim `tv` di JWT saat diterbitkan (`auth.service.ts`). `authenticate` middleware (`auth.middleware.ts`) sekarang query DB dan menolak (401 "Sesi sudah tidak berlaku") kalau `tv` di token tidak cocok lagi dengan `tokenVersion` user saat ini. Token lama tanpa claim `tv` (diterbitkan sebelum fitur ini) diperlakukan sebagai `tv=0`, sama dengan default kolom baru — jadi sesi yang sedang aktif tidak mendadak ke-invalidate massal saat fitur ini di-deploy.
- **Logout sungguhan:** endpoint baru `POST /api/v1/auth/logout` (`auth.controller.ts` + `auth.routes.ts`) menaikkan `tokenVersion` user — otomatis membatalkan *semua* token yang pernah diterbitkan untuknya, di device manapun, bukan cuma device yang logout. Frontend `authService.logout()` (`src/services/auth.service.ts`) sekarang benar-benar memanggil endpoint ini (fire-and-forget, token ditangkap dulu sebelum `localStorage.clear()` supaya request-nya tetap terautentikasi).
- **Bonus — ganti password ikut membatalkan sesi lain:** `changePassword` (`user.controller.ts`) juga menaikkan `tokenVersion`, tapi langsung menerbitkan token baru khusus untuk device yang melakukan perubahan itu (dikirim balik di response, disimpan `user.service.ts`) — supaya device itu sendiri tidak ikut ter-logout oleh aksinya sendiri, sementara sesi lain (kalau ada yang mencurigakan) langsung mati. PIN **sengaja tidak** ikut memicu ini — PIN adalah secret terpisah untuk transaksi, bukan kredensial sesi, jadi kebocorannya bukan indikasi token/sesi ikut kompromi.
- **Trade-off yang disadari:** `authenticate` sekarang melakukan satu query DB tambahan per request terautentikasi (sebelumnya murni stateless, cuma verifikasi signature). Wajar untuk skala aplikasi koperasi ini, tapi dicatat kalau nanti traffic naik signifikan.
- **Diverifikasi end-to-end di database live** (bukan cuma unit test): buat user disposable → login → panggil endpoint terautentikasi (200) → logout → coba pakai token lama lagi → **401 "Sesi sudah tidak berlaku. Silahkan login kembali."** User test & wallet-nya dihapus lagi setelah verifikasi selesai, tidak menyentuh data asli.

---

## 7. [x] Validasi upload file cuma dari ekstensi + mimetype (client-controlled)

**Severity:** Medium — **Fixed**

**Lokasi:** `backend/src/middleware/upload.middleware.ts` (`fileFilter`).

**Kenapa berbahaya:**
- Ekstensi & mimetype dikirim oleh client, gampang dipalsukan. Tidak ada pengecekan magic-byte/isi file asli.
- File yang lolos upload disajikan publik di `/uploads` (`backend/src/app.ts:32-36`) tanpa autentikasi — termasuk kemungkinan foto KTP tergantung bagaimana `ktpPhoto`/Cloudflare service dipakai (perlu dicek lebih lanjut apakah KTP lewat jalur ini atau lewat Cloudflare Images terpisah).

**Rekomendasi:**
- Tambahkan validasi magic-byte (mis. `file-type` package) di atas cek ekstensi/mimetype yang sudah ada.
- Audit ulang: apakah folder `/uploads` publik ini pernah menyimpan dokumen KYC, atau KYC selalu lewat Cloudflare Images (`cloudflare.service.ts`)? Kalau iya lewat Cloudflare, pastikan URL-nya tidak predictable/public-guessable.

**Implementasi:**
- **Konfirmasi audit:** `src/pages/Onboarding.tsx` memanggil `POST /upload` untuk foto KTP *dan* selfie sebelum submit KYC (`ktpPhoto`/`selfiePhoto` diisi dari URL hasil upload itu) — jadi endpoint `/upload` ini memang jalur nyata untuk dokumen KYC, bukan cuma upload generik. Perbaikan ini punya dampak langsung ke situ.
- `backend/src/utils/imageSignature.ts` — pengecekan magic-byte kecil buatan sendiri (bukan library eksternal) untuk 4 format yang memang diizinkan `fileFilter` (jpeg/png/gif/webp). Sempat dicoba pakai package `file-type`, tapi versi yang compatible CommonJS (`16.5.4`) ternyata menambah 1 vulnerability moderate baru di `npm audit` — untuk kebutuhan sesempit ini (4 format dikenal), checker sendiri lebih aman & tidak nambah attack surface dependency. Ditest di `imageSignature.test.ts` (7 test, termasuk kasus file `.php` yang di-rename jadi `.png`).
- `backend/src/middleware/upload.middleware.ts` — middleware baru `validateFileContent` jalan setelah multer menulis file ke disk: baca 12 byte pertama, cocokkan ke signature, **hapus file & return 400** kalau tidak cocok. Dipasang di `upload.routes.ts` sebelum controller, jadi file palsu tidak pernah sampai ke `uploadFile` (yang forward ke Cloudflare atau serve publik di `/uploads`).

---

## 8. [~] `npm audit` backend: 17 vulnerability — ditriase, 10 diperbaiki, 1 perlu keputusan

**Severity:** Medium — **Sebagian selesai**

**Lokasi:** `backend/package-lock.json` — hasil `npm audit` awal: 9 moderate, 8 high.

**Rekomendasi:**
- Jalankan `npm audit` ulang, lihat satu per satu apakah vulnerability itu di dependency yang benar-benar dipakai di runtime (bukan cuma devDependency), lalu putuskan: `npm audit fix`, upgrade manual, atau accepted-risk kalau memang tidak reachable.

**Hasil triase:**
- **`morgan`** (log forging via `:remote-user`, moderate) — app pakai format `'dev'` yang tidak menyertakan token `:remote-user`, jadi jalur yang rentan kemungkinan besar tidak ke-trigger oleh konfigurasi saat ini. Tetap di-patch karena `npm audit fix` (mode aman, non-breaking) mencakupnya.
- **`express`/`body-parser`/`qs`** (DoS di `qs.stringify`, moderate) — fungsi yang rentan (`.stringify` dengan opsi tertentu) biasanya dipakai untuk *membuat* query string keluar, bukan yang Express pakai untuk parsing `req.query` masuk (`qs.parse`). Kemungkinan tidak reachable dari request user biasa, tapi tetap di-patch karena aman (non-breaking).
- **`brace-expansion`** (ReDoS/hang, moderate) — dependency tooling (glob matching), tidak memproses input dari HTTP request saat runtime. Di-patch juga karena termasuk fix aman.
- ✅ Keempat di atas + beberapa lain sudah diberesin lewat `npm audit fix` (tanpa `--force`, jadi tidak ada breaking change) — **17 → 7 vulnerability**. Test (14/14) dan build tetap sukses setelahnya.
- **`drizzle-kit` dan turunannya** (`esbuild`, `@esbuild-kit/*`, `tar`, `@mapbox/node-pre-gyp` — total 4 dari 7 sisa, moderate-high) — ini CLI tool untuk migrasi (`db:generate`/`db:push`/`db:studio`), **tidak pernah di-import ke `app.ts`/`server.ts`**, jadi tidak reachable dari API yang publik. Risikonya cuma kalau `drizzle-kit studio` dijalankan di jaringan yang tidak dipercaya. Saya nilai **accepted-risk untuk saat ini** — fix-nya butuh upgrade major (`drizzle-kit` 0.20→0.31) yang sekalian perlu ditest bareng #6 di bawah.
- **`drizzle-orm`** (SQL injection via SQL identifier yang tidak di-escape dengan benar, **high**, [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) — **ini beda cerita**: dipakai di *setiap* query di seluruh backend (semua controller). Fix butuh upgrade `^0.29.3` → `>=0.45.2`, lompatan besar untuk package yang masih versi `0.x` (per semver, tiap rilis minor di `0.x` dianggap berpotensi breaking). Belum saya jalankan otomatis — **ini butuh keputusan eksplisit** karena:
  1. Perlu regression testing menyeluruh (app ini belum punya test yang benar-benar exercise query DB asli, cuma unit test util murni).
  2. Kalau ada breaking API change antara versi tersebut, semua controller yang pakai Drizzle berpotensi kena.
  - **Rekomendasi saya:** kerjakan ini sebagai task terpisah, sengaja disiapkan waktu untuk test manual tiap fitur transaksi/CRUD setelah upgrade — jangan digabung buru-buru ke sesi ini.

---

## 9. [x] OTP login & KYC masih hardcoded (`'123456'`), belum ada gateway WA sungguhan

**Severity:** High (ditemukan saat mengerjakan #1) — **Fixed**

**Lokasi:** `backend/src/controllers/auth.controller.ts` (`DEFAULT_OTP = '123456'`), `backend/src/services/auth.service.ts` (`verifyLoginOtp`, `verifyKycOtp` membandingkan ke `DEFAULT_OTP`), `requestKycOtp` cuma komentar `// Logic kirim WA gateway disini`.

**Kenapa berbahaya:**
- OTP-nya bukan rahasia yang di-generate acak per percobaan — nilainya konstan dan sekarang tertulis jelas di kode (dan di dokumen ini). Siapa pun yang tahu itu (termasuk lewat repo ini) bisa lewati verifikasi OTP untuk akun manapun.
- Ini melemahkan manfaat rate limiting yang baru dipasang di #1 untuk endpoint OTP — membatasi *jumlah percobaan* tidak banyak menolong kalau nilai yang benar sudah diketahui publik, bukan lagi rahasia yang perlu ditebak.
- Kemungkinan besar ini memang stub sementara untuk development (belum ada integrasi WA gateway), tapi ini **blocker sebelum go-live** kalau OTP dimaksudkan sebagai lapisan keamanan sungguhan.

**Rekomendasi:**
- Generate OTP acak (mis. 6 digit random) per request, simpan hash/nilainya dengan TTL pendek (5-10 menit) di DB atau cache, lalu kirim lewat WA gateway/email sungguhan.
- Setelah itu ada, sambungkan rate limiting yang sudah dipasang di #1 — kombinasinya baru benar-benar efektif (OTP acak + dibatasi percobaannya).

**Implementasi (keputusan bareng user: jalur email, bukan WA gateway):**
- **Kenapa email, bukan WA:** WA butuh WhatsApp Business API (kompleks & berbayar), sedangkan email cukup SMTP biasa. Konsisten dengan alur ahli waris di #11 yang juga sudah pakai email (support@kmp-adng.id).
- **Skema baru:** tabel `otp_codes` (`userId`, `purpose`, `codeHash` di-bcrypt, `expiresAt`, `consumedAt`) — satu tabel untuk 3 keperluan: `registration`, `kyc_verification`, `password_reset`. Migration `0006_flaky_gargoyle.sql`, sudah di-push ke DB live.
- **Email wajib saat registrasi** (`registerSchema`) — jadi jalur pengiriman OTP. Field lama yang cuma nempel di state frontend tapi tidak pernah dikirim ke backend (`Register.tsx`) sekarang benar-benar dipakai.
- **`backend/src/utils/otp.ts`** — `generateNumericOtp()` (6 digit acak, `crypto.randomInt`, bukan hardcoded) untuk kode yang diketik manual; `generateResetToken()` (32 byte acak) untuk link reset password. `verifyOtp()` cuma menerima kode yang belum expired & belum dipakai, langsung di-`consumedAt` begitu cocok -- reuse otomatis ditolak.
- **`backend/src/services/email.service.ts`** — pakai `nodemailer`. Kalau `SMTP_HOST` belum diisi di `.env`, email tidak dikirim tapi isinya di-log ke console (supaya dev/testing tanpa SMTP nyata tetap bisa jalan) -- lihat catatan env var di bawah.
- **Alur diperluas** (atas permintaan user, bukan cuma fix OTP): registrasi sekarang langsung redirect ke layar OTP (bukan lempar ke halaman login dulu). **Fitur baru: Lupa Password** -- `POST /auth/forgot-password` (identifier bebas phone/email, selalu balas pesan generik yang sama supaya tidak bisa dipakai enumerasi akun terdaftar) mengirim link ke email berisi token sekali-pakai, `POST /auth/reset-password` memvalidasi token lalu ganti password + **menaikkan `tokenVersion`** (semua sesi lama di semua device otomatis mati, konsisten dengan pola di #6). Login sudah lama mendukung phone ATAU email sebagai identifier (tidak perlu diubah).
- **Rate limiting**: `forgot-password`/`reset-password` pakai `attemptLimiter` yang sama seperti #1 (5x/15 menit), plus `register` sekarang juga dilindungi `authIpLimiter` (dulu tidak, karena OTP masih palsu jadi belum jadi target abuse; sekarang beneran kirim email jadi perlu dilindungi dari spam).
- **Diverifikasi end-to-end di server live** (SMTP belum dikonfigurasi, jadi OTP/link dibaca dari console log, bukan email sungguhan -- logic-nya identik): registrasi tanpa email ditolak -> dengan email sukses & OTP acak ter-generate (bukan `123456`) -> OTP salah ditolak -> OTP benar diterima -> reuse OTP yang sama ditolak -> forgot-password untuk email terdaftar & tidak terdaftar balas pesan **identik** (anti-enumerasi terverifikasi) -> reset dengan token salah ditolak -> token benar berhasil ganti password & `tokenVersion` naik -> reuse token yang sama ditolak -> login pakai password lama ditolak, password baru berhasil. Data test dihapus lagi setelahnya.

**Yang masih perlu dilakukan user (bukan kode):** isi kredensial SMTP asli di `backend/.env` supaya email benar-benar terkirim (sebelum itu, sistem cuma log ke console, fungsinya tetap benar tapi tidak ada email yang sampai ke inbox). Variabel yang dibutuhkan: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true`/`false`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

**Di luar scope (disepakati bareng user, untuk didiskusikan lain waktu):** mengelola email *masuk* ke domain aplikasi (mis. inbox `support@kmp-adng.id` yang dibaca Admin di alur #11) butuh infrastruktur mail hosting terpisah (Google Workspace/Zoho Mail/dst) -- beda sama sekali dari SMTP kirim email yang baru dikerjakan di sini.

---

## 10. [x] `getAllUsers` (admin) mengembalikan hash password & PIN mentah-mentah

**Severity:** High — **Fixed** (ditemukan saat audit #4, di luar 9 temuan awal)

**Lokasi:** `backend/src/controllers/admin.controller.ts` — `getAllUsers` (`GET /api/v1/admin/users`, digerbangi `verifyRole(['admin','super_admin'])`).

**Kenapa berbahaya:**
- `let query = db.select().from(users)` — tanpa filter kolom, otomatis SELECT semua 40+ kolom termasuk `password` (hash bcrypt) dan `pin` (hash bcrypt) — dikirim apa adanya ke client (`return successResponse(res, result, ...)`).
- Dibandingkan endpoint admin lain di file yang sama (`getPendingApprovals`) yang sudah benar-benar eksplisit `.select({ userName, userEmail, ... })`, ini kelihatan luput saat development, bukan disengaja.
- Admin/super_admin memang berhak lihat data anggota (NIK/KTP dsb, sesuai `PRIVACY.md` §4 "Akses Terbatas"), tapi hash password/PIN **tidak ada gunanya sama sekali** dikirim ke client — itu murni menambah permukaan risiko (kalau device admin kena malware/network di-sniff, atau response ini ke-log/cache di suatu tempat) tanpa manfaat fungsional apapun.

**Implementasi:**
- Pakai `getTableColumns(users)` dari drizzle-orm, destructure keluar `password` & `pin`, sisanya (`safeUserColumns`) yang di-`select()`. Otomatis ikut exclude kalau nanti ada kolom sensitif baru ditambahkan ke schema — tidak perlu diingat-ingat manual di setiap select.
- **Diverifikasi live**: bikin admin test disposable → login → panggil `GET /admin/users` → field `password` dan `pin` dikonfirmasi **tidak ada** di response (39 field lain tetap ada seperti biasa, termasuk NIK/KTP yang memang untuk keperluan verifikasi admin). Test user dihapus lagi setelahnya.

---

## 11. [x] "Hak Dilupakan" (§5 kebijakan privasi) baru separuh jalan — permohonan resign tidak pernah diproses

**Severity:** Medium-High (regulasi — ditemukan saat audit #4) — **Fixed**

**Lokasi:** `backend/src/controllers/user.controller.ts` (`requestResignation`) — insert ke tabel `resignationRequests` status `pending`. Sudah di-grep seluruh backend: **tidak ada satupun endpoint** yang membaca/approve/memproses tabel ini.

**Kenapa jadi masalah:**
- `PRIVACY.md` §5 menjanjikan "Anda dapat mengajukan penghapusan akun" — secara teknis separuh benar (pengajuan tersimpan), tapi tidak ada mekanisme apapun untuk benar-benar menjalankannya (approve, non-aktifkan akun, dsb). Permohonan yang masuk akan diam selamanya di tabel `pending`.
- Untuk UU PDP, hak penghapusan/pembekuan data idealnya bisa benar-benar dipenuhi dalam jangka waktu wajar, bukan cuma diterima ke antrian yang tidak pernah ditindaklanjuti.

**Rekomendasi:**
- Butuh keputusan produk dulu (bukan cuma kode): siapa yang approve resign (admin? sistem otomatis?), apa yang terjadi ke akun setelah disetujui (status `inactive`/`resigned`? NIK/foto KTP dihapus atau tetap disimpan untuk keperluan audit 5-10 tahun sesuai §5 catatan akuntansi?). Baru setelah itu jelas, bikin endpoint admin untuk approve + eksekusi keputusannya.

**Implementasi (alur bisnis lengkap dari user, 2 jalur):**

*Skema baru:* kolom `bankName`/`bankAccountNumber`/`bankAccountHolder` di `users` (diisi anggota sendiri di Settings), nilai `closed` di `users.status` (kolom sudah `varchar` biasa, tidak perlu migration enum), dan `caseType`/`disbursementMethod`/`closedAt`/`closedBy` di `resignationRequests`. Migration `0005_faulty_speed_demon.sql`, sudah di-push ke DB live.

*Jalur A -- anggota masih hidup:* `requestResignation` sekarang **menolak** pengajuan kalau rekening bank belum diisi (endpoint baru `PUT /users/bank-account`). GM approve/reject lewat `GET/PUT /admin/resignations`. Approve -> status `approved`, **berhenti di situ** (sesuai keputusan user: transfer bank & penutupan akun dilakukan manual di luar sistem untuk saat ini, belum ada integrasi payment gateway).

*Jalur B -- ahli waris (anggota meninggal):* Admin membuat pengajuan atas nama anggota (`POST /admin/resignation/heir`, berdasarkan email manual ke support@kmp-adng.id), pilih metode transfer bank atau tunai. GM approve -> kalau tunai, status jadi `awaiting_cashier`. Kasir buka menu baru **"PENCAIRAN TUTUP AHLI WARIS"** (`CashierDashboard.tsx`), eksekusi (`POST /admin/resignations/:id/execute-cash`) -> **sistem benar-benar mengeksekusi** (beda dari jalur bank transfer): jurnal semua ekuitas + saldo dompet jadi nol dalam satu transaksi DB atomik, catat transaksi audit `EQUITY_CLOSURE_CASH`, `resignationRequests.status='closed'`, `users.status='closed'`.

*Role gating:* `createHeirResignation` (admin/super_admin), `decideResignation` (general_manager/super_admin), `getAwaitingCashierResignations` + `executeHeirClosure` (cashier only) — konsisten dengan pola `verifyRole` yang sudah ada di `admin.routes.ts`.

**Diverifikasi end-to-end di database live** (5 user disposable: 2 member, admin, GM, cashier):
- Jalur A: tolak resign tanpa rekening bank -> isi rekening -> resign sukses -> GM approve -> **dikonfirmasi user.status tetap `active`** (tidak auto-closed, sesuai desain).
- Jalur B: admin buat kasus tunai -> GM approve (`awaiting_cashier`) -> kasir lihat antrian -> eksekusi -> **total payout Rp 1.700.000 tepat** (saldo 500rb + simpanan 1,2jt) -> wallet ter-zero semua, `users.status='closed'`, transaksi audit tercatat lengkap.
- Guard teruji: eksekusi dobel ditolak (`"tidak dalam status menunggu eksekusi Kasir"`), member biasa akses endpoint kasir -> 403.
- Semua data test dihapus lagi setelah verifikasi, tidak menyentuh data asli.

---

## 12. [ ] Alur consent onboarding — dicek, sudah cukup baik (tidak perlu perbaikan)

**Catatan dari audit #4, bukan temuan masalah.** `src/pages/Onboarding.tsx`: 3 checkbox eksplisit terpisah (Syarat & Ketentuan, Kebijakan Privasi, Piagam) wajib dicentang semua sebelum lanjut (step 1), dan urutannya benar — consent terjadi **sebelum** pengumpulan NIK/foto KTP (step 4). Sesuai prinsip "consent sebelum pengumpulan data pribadi spesifik".

---

## Ringkasan Prioritas

| # | Temuan | Severity | Effort perbaikan | Status |
| --- | --- | --- | --- | --- |
| 1 | Tidak ada rate limiting | High | Kecil-Sedang | ✅ Selesai |
| 10 | `getAllUsers` bocorkan hash password/PIN | High | Kecil | ✅ Selesai |
| 9 | OTP hardcoded, belum ada gateway email | High | Sedang (butuh integrasi eksternal) | ✅ Selesai (menunggu kredensial SMTP asli di `.env`) |
| 4 | NIK/KTP & UU PDP | High | Perlu diskusi/keputusan dulu | 🟡 Diaudit, encryption-at-rest masih gap |
| 11 | "Hak dilupakan" belum ada endpoint proses resign | Medium-High | Perlu keputusan produk dulu | ✅ Selesai |
| 2 | CORS wildcard | Medium-High | Kecil | ✅ Selesai |
| 3 | CSP dimatikan | Medium-High | Sedang (butuh testing) | ✅ Selesai |
| 6 | JWT tanpa revocation | Medium | Sedang-Besar | ✅ Selesai (3d + tokenVersion) |
| 7 | Upload file validation lemah | Medium | Kecil-Sedang | ✅ Selesai |
| 8 | npm audit (17 vuln) | Medium | Kecil (triase), variatif (fix) | 🟡 10 fixed, drizzle-orm & drizzle-kit tersisa (butuh keputusan) |
| 5 | PIN hash rapuh di getProfile | Low-Medium | Kecil | ✅ Selesai |
| 12 | Alur consent onboarding | - | - | ✅ Dicek, sudah baik |

Rekomendasi urutan pengerjaan selanjutnya: #2 dan #5 (effort kecil, bisa langsung), lalu #7. #9 dan #4 butuh keputusan/pekerjaan lebih besar (integrasi WA gateway, kebijakan data pribadi) jadi cocok didiskusikan dulu sebelum eksekusi, seperti pola yang kita pakai untuk #1.
