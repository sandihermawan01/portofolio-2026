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

## 3. Setup Firebase

### 3.1 Buat project & aktifkan layanan

1. Buat project baru di [Firebase Console](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → aktifkan **Email/Password**.
   Jangan aktifkan metode lain kecuali Anda sengaja menambahkannya.
3. **Firestore Database** → buat database (mode production).
4. Tidak perlu mengaktifkan **Storage** — proyek ini memakai Cloudinary
   untuk upload gambar (bagian 3.5), bukan Firebase Storage, supaya Anda
   tidak perlu upgrade ke plan berbayar Blaze.

### 3.2 Config untuk client (`NEXT_PUBLIC_*`)

Project settings → General → "Your apps" → tambah Web app → salin objek
`firebaseConfig` ke variabel `NEXT_PUBLIC_FIREBASE_*` di `.env.local`.

### 3.3 Service account untuk server (Admin SDK)

Project settings → Service accounts → **Generate new private key** → unduh
JSON. Dari file tersebut, isi:

- `FIREBASE_ADMIN_PROJECT_ID` ← `project_id`
- `FIREBASE_ADMIN_CLIENT_EMAIL` ← `client_email`
- `FIREBASE_ADMIN_PRIVATE_KEY` ← `private_key` (tempel sebagai satu baris,
  dengan `\n` literal menggantikan baris baru — begini memang formatnya saat
  disalin ke file `.env`)

**Jangan pernah commit file JSON ini atau isi `.env.local` ke repository.**

### 3.4 Deploy Security Rules

```bash
firebase login
firebase use --add   # pilih project Firebase Anda, alias "default"
firebase deploy --only firestore:rules,firestore:indexes
```

### 3.5 Cloudinary (upload gambar)

Pengganti Firebase Storage untuk avatar, cover project, dan gallery.

1. Daftar gratis di [cloudinary.com](https://cloudinary.com) (tidak perlu
   kartu kredit).
2. Buka **Dashboard** — tiga nilai di bagian atas langsung dipakai:
   - `CLOUDINARY_CLOUD_NAME` ← "Cloud name"
   - `CLOUDINARY_API_KEY` ← "API Key"
   - `CLOUDINARY_API_SECRET` ← "API Secret" (klik "Reveal" dulu)
3. Tempel ketiganya ke `.env.local`. Tidak ada setup tambahan (folder
   `avatars/`/`projects/` dibuat otomatis oleh aplikasi saat upload
   pertama) — lihat `src/lib/media/cloudinary-upload.ts`.

Free tier Cloudinary memberi 25 "credit" bulanan (kira-kira setara 25GB
storage atau bandwidth bulanan, tergantung kombinasi pemakaian) — jauh lebih
dari cukup untuk foto profil + gambar project sebuah portofolio.

## 4. Membuat admin pertama

Tidak ada pendaftaran publik — ini disengaja. Langkahnya:

1. **Buat user** di Firebase Console → Authentication → Add user (isi email
   & password pemilik website).
2. **Beri hak admin** lewat script provisioning:
   ```bash
   npm run seed:admin -- owner@example.com
   ```
   Script ini men-set custom claim `admin: true` pada user tersebut dan
   mencetak UID-nya.
3. **Tambahkan UID tadi** ke `ADMIN_UID_ALLOWLIST` di `.env.local`
   (comma-separated bila lebih dari satu admin). Aplikasi mengecek **custom
   claim DAN allowlist** sekaligus — lihat `docs/ARCHITECTURE.md`.
4. Login di `/admin/login` dengan email/password tersebut.

## 5. Environment variables

Lihat `.env.example` untuk daftar lengkap beserta komentar setiap variabel.
Ringkasan kategorinya:

| Kategori | Variabel | Catatan |
|---|---|---|
| Firebase client | `NEXT_PUBLIC_FIREBASE_*` | aman diekspos ke browser (bukan secret — akses sebenarnya diatur oleh Security Rules) |
| Firebase admin | `FIREBASE_ADMIN_*` | **server-only**, jangan pernah diekspos ke client |
| Admin access | `ADMIN_UID_ALLOWLIST` | daftar UID admin, dipakai bersama custom claim |
| Session | `SESSION_COOKIE_SECRET`, `SESSION_EXPIRES_IN_SECONDS` | |
| Contact rate limit | `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW_SECONDS` | lihat keterbatasan di bagian 8 |
| Site | `NEXT_PUBLIC_SITE_URL` | dipakai untuk metadata, sitemap, dan pengecekan origin (CSRF) |

Environment divalidasi dengan Zod saat aplikasi start (`src/config/env.ts`)
— deploy dengan variabel yang salah/kosong akan gagal cepat dengan pesan
yang jelas, bukan berjalan dalam keadaan rusak.

## 6. Menjalankan Firebase Emulator (opsional tapi disarankan)

Untuk development tanpa menyentuh data production:

```bash
npm run emulators
```

Lalu set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` di `.env.local` sebelum
`npm run dev`, supaya client SDK terhubung ke emulator, bukan project
sungguhan.

## 7. Testing

```bash
npm run test          # unit test (validasi Zod, rate limiter, slugify)
npm run test:rules    # Firestore + Storage Security Rules, via Firebase Emulator
npm run lint
npm run typecheck
npm run build
```

### Status pengujian (jujur, bukan klaim)

- **Belum pernah dijalankan** di lingkungan pembuatan proyek ini karena
  tidak ada akses jaringan ke registry npm (lihat catatan di bagian 2), jadi
  `node_modules` tidak pernah ter-install di sana.
- Semua file test (`tests/unit/*.test.ts`, `tests/rules/*.test.ts`) ditulis
  lengkap dan seharusnya berjalan begitu dependency ter-install — cakupannya:
  - Validasi Zod untuk Profile, ContactInfo, Experience (termasuk aturan
    `isCurrent`/`endDate`), Project (termasuk format slug & status), dan
    contact form (termasuk honeypot).
  - Rate limiter in-memory (allow/block/reset per key).
  - `slugify()`.
  - Firestore Rules: baca publik untuk `site/profile`, `site/contact`,
    `experiences`; baca publik **hanya** untuk project `published` (draft
    harus gagal untuk anonymous **dan** untuk user non-admin); tulis hanya
    untuk `admin: true`; `messages` tidak bisa dibaca/ditulis client sama
    sekali (termasuk oleh admin).
  - Tidak ada lagi Storage Rules test (dihapus bersama migrasi ke
    Cloudinary) — validasi upload gambar (tipe MIME, ukuran, magic bytes)
    sekarang murni di kode server (`src/lib/media/cloudinary-upload.ts`),
    jadi dicakup lewat test unit biasa, bukan test rules berbasis emulator.
- **Manual/E2E testing (login→CRUD→publish→lihat di publik, responsive
  check di mobile/tablet/desktop) belum dilakukan sama sekali** — sesuai
  permintaan, ini akan dijalankan oleh pemilik proyek sendiri.
- Sebagai pengganti type-check penuh (tidak bisa jalan tanpa `node_modules`),
  dilakukan pemeriksaan sintaks kasar (keseimbangan kurung/tanda kurung) di
  seluruh 89 file `.ts`/`.tsx` — tidak ditemukan masalah, tapi ini **bukan**
  pengganti `tsc --noEmit` yang sesungguhnya.

**Jalankan `npm install && npm run lint && npm run typecheck && npm run build`
sesegera mungkin setelah clone**, sebelum melanjutkan ke test lain, untuk
menangkap error yang tidak bisa dideteksi tanpa compiler sungguhan.

### Troubleshooting

Masalah berikut sempat muncul saat pertama kali menjalankan langkah di atas
pada mesin nyata (tidak tertangkap di lingkungan pembuatan proyek karena
`npm install` tidak bisa jalan di sana sama sekali) — semuanya **sudah
diperbaiki** di source ini, dicatat di sini untuk transparansi:

- **`ERESOLVE` saat `npm install`** — `@firebase/rules-unit-testing@3.0.4`
  hanya mendukung `firebase@^10`, padahal proyek memakai `firebase@11`.
  Diperbaiki dengan menaikkan `@firebase/rules-unit-testing` ke `^4.0.0`
  (mendukung `firebase@11`) di `package.json`.
- **`tests/unit/rate-limit.test.ts` gagal dengan error "cannot be imported
  from a Client Component module"** — `lib/security/rate-limit.ts` punya
  `import "server-only"` yang menolak jalan di luar proses build Next.js
  (termasuk di Vitest). Dihapus, karena modul ini tidak punya dependency
  Node-only maupun secret — amannya hanya konvensi, bukan kontrol keamanan.
- **`npm run test:rules` gagal "port not open"** — port emulator (8080,
  9199, 4000) bentrok dengan proses lain di mesin Anda. Port default diganti
  ke 8089 (Firestore), 9198 (Storage), 4100 (UI) di `firebase.json` +
  `src/lib/firebase/client.ts` untuk mengurangi kemungkinan bentrok. Jika
  masih bentrok, ubah port tersebut lagi ke angka bebas lain di kedua file
  itu (harus sama persis di keduanya).
- **`npm run lint` gagal "couldn't find eslint.config.js"** — ESLint 9
  mewajibkan flat config, proyek awalnya belum punya `eslint.config.mjs`.
  Ditambahkan (`eslint.config.mjs`, bridging `eslint-config-next` lewat
  `FlatCompat`, lihat dependency baru `@eslint/eslintrc`).
- **`npm run build` gagal "node:process"/"node:stream" tidak dikenali
  webpack, dan "Dynamic Code Evaluation ... not allowed in Edge Runtime"**
  — ini bug paling signifikan: `src/middleware.ts` (yang **selalu** berjalan
  di Edge Runtime, bukan Node.js) sebelumnya mengimpor `SESSION_COOKIE_NAME`
  dari `lib/firebase/auth.ts`, yang pada gilirannya mengimpor
  `firebase-admin` — library Node-only yang tidak bisa jalan di Edge
  Runtime. Diperbaiki dengan memindahkan konstanta itu ke
  `src/lib/auth-constants.ts` (modul kosong tanpa dependency apa pun), yang
  sekarang diimpor langsung oleh `middleware.ts`, sehingga middleware tidak
  pernah menyentuh `firebase-admin` sama sekali. `next.config.ts` juga
  ditambah `serverExternalPackages: ["firebase-admin"]` agar Admin SDK
  tidak ikut di-bundle webpack untuk route Node.js, melainkan di-`require()`
  langsung saat runtime.

## 8. Keterbatasan yang diketahui (belum diselesaikan)

- **Rate limiter in-memory, per-instance** — cukup untuk single instance /
  traffic rendah, tidak scalable untuk multi-instance serverless production.
  Lihat `docs/ARCHITECTURE.md` bagian "Rate limiting" untuk cara upgrade.
- **Belum ada pengiriman email** untuk notifikasi contact form baru —
  pesan tersimpan aman di Firestore (`messages`), tapi pemilik harus cek
  manual lewat Firebase Console sampai integrasi email provider
  ditambahkan.
- **Belum ada UI admin untuk membaca daftar pesan contact form** — di luar
  scope CRUD yang diminta (About/Experience/Project/Contact settings), tapi
  ini titik buta yang wajar untuk iterasi berikutnya (inbox read-only di
  `/admin/messages`).
- Belum ada test end-to-end otomatis (Playwright/Cypress) untuk alur
  login→CRUD→publish; hanya unit test dan Security Rules test.

## 9. Deployment

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

## 10. Struktur folder

Lihat struktur lengkap di `docs/ARCHITECTURE.md`. Ringkas: `src/app` (routing
& pages), `src/components` (UI reusable), `src/features` (logic per domain:
queries, Server Actions, form), `src/lib` (Firebase, security, validasi,
utils), `firebase/` (Security Rules & indexes), `scripts/` (provisioning
admin), `tests/` (unit + rules).
