# Portfolio — Monochrome Retro

Website portofolio personal full-stack: area publik (About, Experience,
Project, Contact) + dashboard admin privat untuk mengelola konten, dibangun
dengan Next.js (App Router, TypeScript), Tailwind CSS, Firebase
(Authentication + Firestore — **keduanya gratis di plan Spark**), dan
Cloudinary untuk upload gambar (juga gratis, tanpa kartu kredit).

Dokumen terkait:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — route map, model auth,
  keputusan teknis (termasuk alasan tidak memakai Vite).
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — skema lengkap setiap koleksi
  Firestore.

## 1. Prasyarat

- Node.js ≥ 20.9
- Akun Firebase (plan gratis **Spark** — proyek ini hanya memakai
  Authentication + Firestore, keduanya tersedia penuh di Spark, **tidak**
  perlu upgrade ke Blaze)
- Akun Cloudinary gratis (untuk upload gambar — lihat bagian 3.5; dipakai
  sebagai pengganti Firebase Storage yang mewajibkan plan berbayar Blaze
  hanya untuk membuat bucket)
- Firebase CLI: `npm install -g firebase-tools` (untuk emulator & deploy
  rules)

## 2. Setup lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` — lihat bagian 3 untuk cara mendapatkan setiap nilai.

```bash
npm run dev
```

Buka http://localhost:3000. Dashboard admin ada di `/admin/login`.

> **Catatan dari proses pembuatan proyek ini**: kode sumber lengkap di repo
> ini ditulis manual tanpa menjalankan `npm install` terlebih dahulu
> (lingkungan kerja yang dipakai tidak punya akses ke registry npm), jadi
> `npm install`, `npm run build`, `npm run lint`, `npm run typecheck`, dan
> seluruh test **belum pernah benar-benar dijalankan**. Jalankan langkah
> tersebut di mesin Anda sebagai langkah pertama setelah clone — lihat
> bagian 7 (Testing) untuk detail apa yang sudah/belum tervalidasi.

## 3. Environment variables

Lihat `.env.example` untuk daftar lengkap beserta komentar setiap variabel.
Ringkasan kategorinya:

| Kategori | Variabel | Catatan |
|---|---|---|
| Firebase client | `NEXT_PUBLIC_FIREBASE_*` | aman diekspos ke browser (bukan secret — akses sebenarnya diatur oleh Security Rules) |
| Firebase admin | `FIREBASE_ADMIN_*` | **server-only**, jangan pernah diekspos ke client |
| Admin access | `ADMIN_UID_ALLOWLIST` | daftar UID admin, dipakai bersama custom claim |
| Session | `SESSION_COOKIE_SECRET`, `SESSION_EXPIRES_IN_SECONDS` | |
| Contact rate limit | `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_SECONDS` | lihat keterbatasan di bagian 8 |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `CLOUDINARY_API_SECRET` **server-only** |
| GitHub Activity (opsional) | `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_SYNC_CRON_SECRET`, `GITHUB_SYNC_CACHE_TTL_MINUTES` | semuanya **server-only**; lihat bagian 3.6 |
| Site | `NEXT_PUBLIC_SITE_URL` | dipakai untuk metadata, sitemap, dan pengecekan origin (CSRF) |

Environment divalidasi dengan Zod saat aplikasi start (`src/config/env.ts`)
— deploy dengan variabel yang salah/kosong akan gagal cepat dengan pesan
yang jelas, bukan berjalan dalam keadaan rusak.

## 4. Menjalankan Firebase Emulator (opsional tapi disarankan)

Untuk development tanpa menyentuh data production:

```bash
npm run emulators
```

Lalu set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` di `.env.local` sebelum
`npm run dev`, supaya client SDK terhubung ke emulator, bukan project
sungguhan.

## 5. Testing

```bash
npm run test          # unit test (validasi Zod, rate limiter, slugify)
npm run test:rules    # Firestore + Storage Security Rules, via Firebase Emulator
npm run lint
npm run typecheck
npm run build
```


## 6. Deployment

Rekomendasi: **Vercel** untuk aplikasi Next.js + **Firebase** untuk
Auth/Firestore/Storage (keduanya tidak harus dari provider yang sama).

1. Push repo ke GitHub/GitLab, import ke Vercel.
2. Set semua environment variable dari `.env.example` di Vercel project
   settings (Production **dan** Preview jika dipakai).
3. Deploy Security Rules dari bagian 3.4 — ini terpisah dari deploy Next.js,
   jangan lupa jalankan ulang setiap kali `firebase/*.rules` berubah.
4. Pastikan `NEXT_PUBLIC_SITE_URL` di-set ke domain production yang benar —
   dipakai untuk pengecekan origin (CSRF) pada `/api/session`, jadi login
   admin akan gagal bila nilainya salah.

## 7. Struktur folder

Lihat struktur lengkap di `docs/ARCHITECTURE.md`. Ringkas: `src/app` (routing
& pages), `src/components` (UI reusable), `src/features` (logic per domain:
queries, Server Actions, form), `src/lib` (Firebase, security, validasi,
utils), `firebase/` (Security Rules & indexes), `scripts/` (provisioning
admin), `tests/` (unit + rules).
