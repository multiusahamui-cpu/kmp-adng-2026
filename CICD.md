
# Strategi CI/CD - KMP-ADNG V2.0

Dokumen ini menjelaskan strategi *Continuous Integration* (CI) dan *Continuous Deployment* (CD) untuk proyek KMP-ADNG V2.0. Tujuan utama adalah mengotomatisasi pengujian, build, dan deployment untuk meminimalkan *human error* dan mempercepat siklus rilis.

---

## 🏗️ Arsitektur Pipeline

Proyek ini adalah **Monorepo Single-Domain**: Frontend (React + Vite, folder `/src`) dan Backend (Node.js + Express, folder `/backend`) berada dalam satu repositori dan di-deploy sebagai **satu proses Node.js**, di **satu domain**.

Saat build, Vite menaruh hasil build frontend langsung ke `backend/public/dist`. Saat runtime, Express (`backend/src/app.ts`) yang menyajikan file statis frontend tersebut *sekaligus* endpoint API (`/api/v1/*`) dari proses yang sama. Tidak ada lagi pemisahan domain frontend/backend — sekali deploy, keduanya ikut naik bersamaan.

```
Root (repo)
├── src/            → Frontend (Vite + React)
├── vite.config.ts  → build.outDir = backend/public/dist
├── package.json    → orkestrasi: install, build, start
└── backend/
    ├── src/app.ts  → serve API (/api/v1) + static frontend (public/dist) + SPA fallback
    └── public/dist → hasil build frontend (auto-generated, jangan commit)
```

### Tools yang Digunakan
*   **Version Control**: GitHub.
*   **Hosting**: PaaS Node.js (Render / Railway / cPanel Node App / dsb) yang menjalankan `npm install` → `npm run build` → `npm start` dari **root repo**.
*   **CI/CD Runner**: GitHub Actions (untuk pengecekan kualitas kode sebelum merge; deploy aktual biasanya sudah otomatis dilakukan oleh platform PaaS saat push ke branch production).

---

## 🔄 1. Continuous Integration (CI) - Automated Checks

Pipeline ini berjalan setiap kali ada **Pull Request (PR)** atau **Push** ke branch `main` atau `develop`.

### Workflow
1.  **Checkout Code**.
2.  **Install Dependencies**: `npm install` di root — otomatis ikut install dependency backend lewat hook `postinstall` (`npm --prefix backend install`).
3.  **Linting**: `npm run lint`.
4.  **Type Checking**: `npm run check` — menjalankan `tsc --noEmit` di frontend *dan* backend dalam satu perintah. Frontend dan backend sama-sama 0 error type saat ini — kalau ada perubahan yang bikin `check` gagal, itu harus dibetulkan sebelum merge, bukan ditoleransi.
5.  **Testing**: `npm run test` — menjalankan Vitest (saat ini baru tersedia di backend, `npm --prefix backend run test`).
6.  **Build Test**: `npm run build` — memastikan frontend *dan* backend sama-sama *compilable* dalam satu perintah.

**Contoh GitHub Actions (CI):**
```yaml
name: CI
on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  build-and-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install (root + backend)
        run: npm install
      - name: Lint
        run: npm run lint
      - name: Type check
        run: npm run check
      - name: Test
        run: npm run test
      - name: Build (frontend + backend)
        run: npm run build
```

---

## 🚀 2. Continuous Deployment (CD) - Production

Karena hanya ada **satu aplikasi Node.js**, deployment jauh lebih sederhana dibanding strategi dual-domain sebelumnya: satu build, satu artifact, satu domain.

### Perintah Standar (dipakai platform PaaS apa pun)
Dijalankan dari **root repo** (bukan dari dalam `/backend`):

| Tahap    | Perintah        | Yang terjadi |
|----------|------------------|--------------|
| Install  | `npm install`    | Install dependency frontend, lalu otomatis install dependency backend (`postinstall`) |
| Build    | `npm run build`  | `tsc && vite build` (frontend → `backend/public/dist`) lalu build TypeScript backend (`backend/dist`) |
| Start    | `npm start`      | Menjalankan `node backend/dist/server.js` — satu proses yang serve frontend + API |

Backend otomatis mendengarkan `process.env.PORT` yang di-inject platform (fallback ke `3000` jika tidak ada), jadi tidak perlu setting manual di kebanyakan PaaS.

### A. Setup di Dashboard PaaS (Render / Railway / cPanel Node App / dsb)
1.  **Root Directory**: `.` (root repo, **bukan** `backend/`).
2.  **Build Command**: `npm run build`.
3.  **Start Command**: `npm start`.
4.  **Environment Variables** (isi di dashboard platform, jangan commit `.env`):
    *   `DATABASE_URL`
    *   `JWT_SECRET`
    *   `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_ACCOUNT_HASH` (jika pakai Cloudflare Images)
    *   `NODE_ENV=production`
    *   `VITE_API_URL` — **biarkan kosong/tidak diisi**. Frontend otomatis memakai relative path `/api/v1` karena satu domain dengan API. Isi hanya jika suatu saat frontend & backend sengaja dipisah lagi ke domain berbeda.
5.  **Database Migration**: jalankan `npm --prefix backend run db:push` (sekali, manual atau via *release command* platform) setiap ada perubahan skema Drizzle sebelum start baru aktif melayani traffic.

### B. Auto-Deploy dari Git
Kebanyakan PaaS modern (Render, Railway, dll) sudah otomatis re-deploy saat ada push ke branch production tanpa perlu workflow GitHub Actions tambahan — cukup hubungkan repo GitHub `kmp-adng-2026` ke platform tersebut dan pilih branch `main`.

Jika platform pilihanmu **tidak** punya integrasi Git otomatis, gunakan contoh GitHub Actions berikut sebagai referensi (sesuaikan `deploy-action` dengan CLI/API platform yang dipakai):

```yaml
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & Build
        run: |
          npm install
          npm run build
      # Ganti step di bawah dengan CLI/API deploy platform yang dipakai
      # (mis. render-deploy-action, railway up, dsb)
      - name: Deploy
        run: echo "Trigger deploy ke platform PaaS di sini"
```

---

## 🛡️ Manajemen Secrets (.env)

Jangan pernah meng-commit file `.env` ke repository (sudah di-`.gitignore`). Gunakan **Environment Variables** di dashboard platform PaaS, atau **GitHub Secrets** kalau perlu dipakai di step CI.

Variabel yang wajib diisi di production:
1.  `DATABASE_URL` (Connection String PostgreSQL)
2.  `JWT_SECRET`
3.  `CF_API_TOKEN` / `CF_ACCOUNT_ID` / `CF_ACCOUNT_HASH` (jika pakai Cloudflare Images)
4.  `NODE_ENV=production`

`VITE_API_URL` **tidak perlu diisi** di setup single-domain — itu satu-satunya perbedaan penting dari cara lama.

---

## 🧪 Strategi Testing

**Unit Testing (sudah berjalan):** Backend pakai **Vitest** (`npm run test` dari root, atau `npm --prefix backend run test`). Baru ada satu contoh test (`backend/src/utils/jwt.test.ts`, round-trip sign/verify JWT) — tambahkan test baru di `backend/src/**/*.test.ts` seiring fitur baru, terutama untuk logika bisnis sensitif (validasi saldo, PIN, dsb). Frontend belum punya test; kalau nanti dibutuhkan, perlu setup tambahan (`jsdom` + `@testing-library/react`) di root.

**Future Roadmap:**
1.  **E2E Testing**: Menggunakan **Cypress** atau **Playwright**.
    *   Simulasi user login, transaksi, dan checkout.
2.  **Frontend Unit Testing**: Vitest + `@testing-library/react` untuk komponen React.

---

## 📝 Checklist Rilis

Sebelum melakukan merge ke `main`:
- [ ] Versi aplikasi di `package.json` dinaikkan (Semantic Versioning).
- [ ] Pastikan tidak ada *console.log* debugging yang tertinggal.
- [ ] `npm run check` sukses (atau error yang muncul memang sudah diketahui/di-track).
- [ ] `npm run test` sukses.
- [ ] `npm run build` sukses dari root (frontend + backend).
- [ ] Cek ulang environment variables di dashboard platform production.
- [ ] Backup database sebelum migrasi skema besar (`npm --prefix backend run db:push`).
