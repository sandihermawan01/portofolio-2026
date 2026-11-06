# My New Portfolio 2026

Website portofolio personal full-stack: area publik (About, Experience,
Project, Contact) + dashboard admin privat untuk mengelola konten, dibangun
dengan Next.js (App Router, TypeScript), Tailwind CSS, Firebase
(Authentication + Firestore — **keduanya gratis di plan Spark**), dan
Cloudinary untuk upload gambar (juga gratis).

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


## 8. Struktur folder

Lihat struktur lengkap di `docs/ARCHITECTURE.md`. Ringkas: `src/app` (routing
& pages), `src/components` (UI reusable), `src/features` (logic per domain:
queries, Server Actions, form), `src/lib` (Firebase, security, validasi,
utils), `firebase/` (Security Rules & indexes), `scripts/` (provisioning
admin), `tests/` (unit + rules).
