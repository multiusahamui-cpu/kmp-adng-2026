
# Strategi CI/CD - KMP-ADNG V2.0

Dokumen ini menjelaskan strategi *Continuous Integration* (CI) dan *Continuous Deployment* (CD) untuk proyek KMP-ADNG V2.0. Tujuan utama adalah mengotomatisasi pengujian, build, dan deployment untuk meminimalkan *human error* dan mempercepat siklus rilis.

---

## 🏗️ Arsitektur Pipeline

Mengingat proyek ini menggunakan struktur Monorepo (Frontend dan Backend dalam satu repositori namun terpisah folder), kita akan menggunakan strategi **Dual Pipeline**:

1.  **Frontend Pipeline**: React + Vite -> Static Hosting (Vercel/Netlify/S3).
2.  **Backend Pipeline**: Node.js + Express -> VPS/Docker Registry.

### Tools yang Digunakan
*   **Version Control**: GitHub / GitLab.
*   **CI/CD Runner**: GitHub Actions (Rekomendasi Utama).
*   **Containerization**: Docker (Untuk Backend).
*   **Process Manager**: PM2 (Jika deploy Backend Non-Docker di VPS).

---

## 🔄 1. Continuous Integration (CI) - Automated Checks

Pipeline ini berjalan setiap kali ada **Pull Request (PR)** atau **Push** ke branch `main` atau `develop`.

### Workflow
1.  **Checkout Code**: Mengambil kode terbaru.
2.  **Dependency Install**:
    *   Root/Frontend: `npm install`
    *   Backend: `cd backend && npm install`
3.  **Linting & Quality Check**:
    *   Memastikan tidak ada error syntax atau gaya penulisan kode yang salah.
    *   Command: `npm run lint`
4.  **Type Checking (TypeScript)**:
    *   Memastikan integritas tipe data di seluruh aplikasi.
    *   Command: `tsc --noEmit`
5.  **Build Test**:
    *   Memastikan kode *compilable*.
    *   Frontend: `npm run build`
    *   Backend: `cd backend && npm run build`

---

## 🚀 2. Continuous Deployment (CD) - Production

Pipeline ini berjalan otomatis hanya ketika ada push/merge ke branch `main` (Production) atau `staging` (Testing).

### A. Frontend Deployment (React)
Frontend akan di-deploy sebagai *Static Site*.

**Target**: Vercel / Netlify / Cloudflare Pages / AWS S3 + CloudFront.

**Langkah-langkah Pipeline:**
1.  **Build**: `npm run build` (Menghasilkan folder `dist/`).
2.  **Deploy**: Upload folder `dist/` ke hosting provider.

**Contoh GitHub Actions (Frontend):**
```yaml
name: Deploy Frontend
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'index.html'
      - 'package.json'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install & Build
        run: |
          npm install
          npm run build
        env:
          VITE_API_URL: https://api.kmp-adng.id/v1
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

### B. Backend Deployment (Express API)
Backend akan di-deploy ke VPS (Virtual Private Server) seperti DigitalOcean, Linode, atau AWS EC2.

**Strategi Database (PostgreSQL + Drizzle):**
*   **Migrasi Otomatis**: Pipeline akan menjalankan `npm run db:push` atau `drizzle-kit migrate` sebelum merestart server untuk memastikan skema DB sesuai dengan kode terbaru.

**Langkah-langkah Pipeline (VPS dengan PM2):**
1.  **SSH ke Server**.
2.  **Pull Code**: `git pull origin main`.
3.  **Install Dependencies**: `cd backend && npm install`.
4.  **Build TypeScript**: `npm run build`.
5.  **Database Migration**: `npm run db:push`.
6.  **Restart PM2**: `pm2 restart kmp-adng-api`.

**Contoh GitHub Actions (Backend via SSH):**
```yaml
name: Deploy Backend
on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/kmp-adng-backend
            git pull origin main
            cd backend
            npm install
            npm run build
            # Penting: Migrasi DB sebelum restart app
            npm run db:push
            pm2 restart kmp-adng-backend
```

---

## 🛡️ Manajemen Secrets (.env)

Jangan pernah meng-commit file `.env` ke repository. Gunakan **GitHub Secrets** atau **GitLab Variables** untuk menyimpan:

1.  `DATABASE_URL` (Connection String PostgreSQL)
2.  `JWT_SECRET`
3.  `API_KEY` (Pihak ketiga: Payment Gateway, Maps, AI)
4.  `SSH_KEY` (Untuk akses VPS)

Saat deployment:
*   **Frontend**: Inject variabel (seperti `VITE_API_URL`) saat proses build di CI.
*   **Backend**: Pastikan file `.env` sudah ada di server VPS atau inject via Docker environment variables.

---

## 🧪 Strategi Testing (Future Roadmap)

Untuk fase selanjutnya, tambahkan tahap **Testing** sebelum build:

1.  **Unit Testing**: Menggunakan **Jest** atau **Vitest**.
    *   Test fungsi logika bisnis (hitung pajak, validasi saldo).
2.  **E2E Testing**: Menggunakan **Cypress** atau **Playwright**.
    *   Simulasi user login, transaksi, dan checkout.

---

## 📝 Checklist Rilis

Sebelum melakukan merge ke `main`:
- [ ] Versi aplikasi di `package.json` dinaikkan (Semantic Versioning).
- [ ] Pastikan tidak ada *console.log* debugging yang tertinggal.
- [ ] Cek ulang konfigurasi `.env` di server production.
- [ ] Backup database sebelum migrasi skema besar.
