# Arsitektur & Keputusan Teknis

## Ringkasan

Next.js 15 (App Router, TypeScript) + Tailwind CSS + shadcn/ui-style
components, Firebase (Auth + Firestore saja — lihat "Upload gambar" di
bawah untuk kenapa tidak Firebase Storage), dan Cloudinary untuk upload
gambar. Server Components by default; Client Components hanya untuk form,
upload gambar, dan elemen interaktif (menu mobile, dialog konfirmasi, dsb).

## Mengapa tidak Vite

Next.js App Router sudah memiliki dev server (Turbopack) dan production
build pipeline sendiri. Tidak ada kebutuhan tooling terpisah yang jelas di
proyek ini (tidak ada aplikasi pendamping yang berdiri sendiri di luar Next.js),
sehingga Vite dihilangkan dari stack sepenuhnya, sesuai instruksi di master
prompt.

## Route map

| Route | Akses | Keterangan |
|---|---|---|
| `/` | publik | Hero + ringkasan skill + project unggulan |
| `/about` | publik | Profil lengkap |
| `/experience` | publik | Timeline pengalaman |
| `/project` | publik | Daftar project **published** saja |
| `/project/[slug]` | publik | Detail project (404 jika draft/tidak ada) |
| `/contact` | publik | Info kontak + form |
| `/admin/login` | publik | Form login (tanpa pendaftaran) |
| `/admin` | admin | Overview / statistik |
| `/admin/about` | admin | Edit profil |
| `/admin/experience`, `/admin/experience/new`, `/admin/experience/[id]` | admin | CRUD experience |
| `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]` | admin | CRUD project (+ publish/unpublish) |
| `/admin/settings` | admin | Edit info contact & social links |
| `/api/contact` | publik (POST) | Terima submission contact form |
| `/api/session` | publik (POST/DELETE) | Tukar ID token → session cookie, dan logout |

## Model Autentikasi & Otorisasi (defense in depth)

1. **Client**: pengguna login dengan Firebase client SDK
   (`signInWithEmailAndPassword`), mendapat ID token.
2. **Pertukaran token → session cookie**: ID token dikirim ke
   `POST /api/session`. Server **memverifikasi ulang** token tersebut dengan
   Admin SDK (`verifyIdToken`, bukan sekadar decode), memastikan UID ada di
   `ADMIN_UID_ALLOWLIST` dan/atau memiliki custom claim `admin: true`, baru
   kemudian membuat **Firebase session cookie** (`HttpOnly`, `Secure` di
   production, `SameSite=Lax`, masa berlaku dikonfigurasi lewat
   `SESSION_EXPIRES_IN_SECONDS`).
3. **Setiap request privat diverifikasi ulang di server** — bukan hanya
   sekali saat login:
   - `src/middleware.ts` **hanya** mengecek *keberadaan* cookie (Edge
     runtime tidak punya Node crypto untuk verifikasi kriptografis), semata
     untuk UX redirect yang cepat. Ini **bukan** lapisan keamanan.
   - `src/app/admin/(protected)/layout.tsx` memanggil
     `getVerifiedAdminSession()` di setiap render (Server Component), yang
     memverifikasi session cookie ke server Firebase
     (`verifySessionCookie(..., checkRevoked: true)`) dan mengecek ulang
     allowlist/custom claim.
   - Setiap Server Action di `src/features/**/actions.ts` memanggil
     `requireAdmin()` secara independen sebelum melakukan operasi apa pun —
     tidak bergantung pada layout atau middleware.
4. **Firestore Rules** sebagai lapisan independen ketiga, untuk kasus
   (sekarang atau di masa depan) di mana client menulis langsung lewat
   Firestore client SDK, bukan lewat Server Action.

Catatan: tidak ada "Storage Rules" di sini — proyek ini tidak memakai
Firebase Storage sama sekali. Lihat bagian "Upload gambar: Cloudinary,
bukan Firebase Storage" di bawah untuk model keamanan upload gambar.

Custom claim `admin: true` di-set lewat `scripts/set-admin-claim.ts`
(dijalankan manual oleh pemilik via `npm run seed:admin -- <uid-or-email>`),
**tidak pernah** lewat endpoint publik — sesuai requirement "tidak ada
public sign-up".

## Upload gambar: Cloudinary, bukan Firebase Storage

Firebase Storage mewajibkan project di-upgrade ke plan berbayar **Blaze**
hanya untuk membuat bucket — meski bucket itu tidak terpakai sama sekali
sampai ada yang benar-benar mengunggah file. Untuk sebuah portofolio
personal dengan segelintir gambar, itu tidak sepadan. Keputusan: ganti ke
**Cloudinary**, yang punya free tier tanpa kartu kredit dan cukup untuk
kasus ini.

Alur upload (`src/lib/media/cloudinary-upload.ts`, dipanggil dari
`src/features/projects/media-actions.ts`):

1. Client memanggil Server Action (`uploadAvatarAction` /
   `uploadProjectImageAction`), bukan Cloudinary langsung — jadi
   `CLOUDINARY_API_SECRET` tidak pernah perlu dikirim ke/diketahui browser.
2. Server Action memanggil `requireAdmin()` lebih dulu (sama persis seperti
   setiap operasi privat lain di aplikasi ini).
3. File divalidasi: tipe MIME dari whitelist (PNG/JPEG/WebP/AVIF — **SVG
   sengaja tidak diizinkan**, karena bisa membawa `<script>` dan merupakan
   vektor stored-XSS umum), ukuran maksimum 5MB, dan isi file dicocokkan ke
   *magic bytes* yang sesuai — bukan percaya begitu saja pada
   `Content-Type` yang dilaporkan browser atau ekstensi nama file.
4. Baru setelah lolos semua itu, server membuat **signed upload** ke
   Cloudinary (`POST /image/upload`, ditandatangani SHA-1 dengan
   `CLOUDINARY_API_SECRET` di server) dengan `public_id` berupa UUID acak di
   bawah folder `avatars/` atau `projects/` — bukan nama file asli dari
   pengguna — supaya tidak ada path traversal maupun ekstensi executable
   yang bisa diselundupkan.
5. Saat gambar diganti/dihapus, server memanggil endpoint `destroy`
   Cloudinary (juga signed) dengan `public_id` yang diekstrak dari URL lama,
   sebagai operasi best-effort yang tidak memblokir aksi utama bila gagal.

Karena validasi dan otorisasi semuanya terjadi di kode server (bukan di
Security Rules penyedia storage), tidak ada lagi lapisan "Storage Rules"
terpisah seperti versi Firebase Storage sebelumnya — `requireAdmin()` +
validasi di atas **adalah** lapisan keamanannya.

## GitHub Activity

Section publik opsional (`/github`, ditautkan dari halaman Project) yang
menampilkan contribution heatmap 12 bulan, daftar repository "Currently
Developing" pilihan admin, dan 3 commit terbaru lintas repository — lihat
bagian 3.6 README untuk setup token/webhook/cron.

**Data flow**: semua panggilan ke GitHub (GraphQL untuk contribution
calendar, REST untuk metadata repo + commit) terjadi **hanya di server**
(`src/lib/github/client.ts`), tidak pernah dari browser. Hasilnya di-cache
ke Firestore `github/cache` oleh `src/lib/github/sync.ts`, dan halaman
publik hanya membaca cache tersebut (`src/features/github/queries.ts`) —
request pengunjung tidak pernah menunggu GitHub API secara langsung.

**Pemicu sync** (ketiganya memanggil fungsi `syncGithubActivity()` yang
sama):

1. **Cron** — `GET/POST /api/github/sync`, dijadwalkan tiap 6 jam
   (`vercel.json`), dilindungi shared secret `GITHUB_SYNC_CRON_SECRET` di
   header `Authorization: Bearer`. **Catatan penting**: secret ini
   sengaja **tidak** bernama `CRON_SECRET`, jadi Vercel Cron tidak
   mengirim header itu secara otomatis — scheduler eksternal atau
   penggantian nama variabel diperlukan untuk produksi (lihat komentar di
   `src/app/api/github/sync/route.ts` dan README bagian 3.6).
2. **Webhook** — `POST /api/github/webhook`, dipicu GitHub setiap kali ada
   `push` ke repository yang dipantau, supaya cache mendekati real-time
   tanpa menunggu jadwal cron. Signature `X-Hub-Signature-256` diverifikasi
   dengan HMAC-SHA256 + `timingSafeEqual` (constant-time, lihat
   `src/lib/github/webhook.ts`) sebelum payload dipercaya sama sekali; repo
   yang di-push dicocokkan dulu ke `selectedRepos` sehingga push ke
   repository yang tidak dipantau tidak memicu sync sama sekali.
3. **Manual** — tombol "Sync Now" di `/admin/github`
   (`syncGithubActivityAction`), untuk admin yang ingin refresh segera
   tanpa menunggu.

**Fallback-on-failure, per bagian**: `syncGithubActivity()` mengambil
contribution calendar, metadata tiap repo, dan commit tiap repo secara
independen. Kegagalan satu bagian (mis. GitHub API rate-limited saat
mengambil commit salah satu repo) **tidak pernah menghapus** nilai cache
bagian itu yang sebelumnya berhasil — hanya bagian yang berhasil fetch
ulang yang ditimpa (`Firestore .set(..., { merge: true })`). Error
dikumpulkan ke `lastSyncErrors` di cache sehingga admin bisa melihat apa
yang gagal tanpa membuka log server, dan halaman publik menampilkan
peringatan "data mungkin tidak terbaru" bila ada error terakhir **atau**
bila `lastSyncedAt` sudah lebih tua dari `GITHUB_SYNC_CACHE_TTL_MINUTES`
(default 6 jam) — jadi sync yang diam-diam berhenti berjalan (bukan cuma
yang gagal dengan error) tetap terlihat.

**Model hybrid admin-curated**: GitHub tidak punya konsep "project yang
sedang saya kerjakan" atau status seperti itu, jadi `status` dan
`sortOrder` tiap repo di `github/config.selectedRepos` murni input admin
(lihat `docs/SCHEMA.md`), sementara nama, deskripsi, bahasa, topics, dan
URL diambil otomatis dari GitHub API saat sync. Menyimpan konfigurasi
(`updateGithubConfigAction`) memverifikasi setiap repo yang dipilih lewat
panggilan langsung ke GitHub (harus ada, publik, dan bisa diakses) sebelum
disimpan — repo yang salah ketik atau sudah di-private-kan gagal disimpan
dengan pesan error spesifik, bukan diam-diam diabaikan.

**Keamanan**: `GITHUB_TOKEN` server-only (tidak pernah di-prefix
`NEXT_PUBLIC_`), hanya butuh scope baca publik minimum (lihat README);
`fetchRepoMetadata()` menolak repo yang ternyata **private** meski token
punya akses ke sana, karena fitur ini murni untuk menampilkan aktivitas
publik. `github/cache` di Firestore Rules **tidak bisa ditulis oleh
siapa pun lewat client SDK, termasuk admin** — satu-satunya penulis adalah
Admin SDK dari `syncGithubActivity()`; `github/config` bisa ditulis admin
(lewat Server Action, yang juga lapisan rules sebagai pertahanan kedua)
tapi tidak oleh siapa pun yang lain. Lihat `firebase/firestore.rules` dan
`tests/rules/firestore.rules.test.ts`.

**Degradasi tanpa konfigurasi**: tanpa `GITHUB_TOKEN`, `syncGithubActivity()`
langsung berhenti dengan satu error yang jelas (bukan mencoba dan gagal
berkali-kali), dan setiap bagian di UI publik (`GithubActivitySection`)
punya empty state sendiri-sendiri — username kosong tidak menyembunyikan
daftar repo, daftar repo kosong tidak menyembunyikan heatmap, dst. Halaman
`/github` sendiri me-render `404` selama admin belum menyalakan
`widgetVisible`, persis seperti project berstatus draft.

## Caching & Revalidation

- Halaman publik menggunakan `revalidate = 0` pada beberapa route (lihat
  komentar di masing-masing `page.tsx`) agar perubahan dari admin langsung
  terlihat tanpa harus menunggu ISR, mengikuti instruksi "hindari cache yang
  membuat konten lama terus tampil".
- Setiap Server Action yang mengubah data memanggil `revalidatePath()` pada
  halaman publik terkait setelah menulis ke Firestore, sebagai lapisan
  tambahan agar perubahan langsung ter-refresh meski ada cache di layer lain.

## Penyimpanan pesan contact form

Master prompt mengizinkan penyimpanan pesan **jika dirancang dan diamankan
secara eksplisit**. Keputusan: pesan **disimpan** ke koleksi Firestore
`messages` via Admin SDK (bukan client SDK), supaya pemilik tidak kehilangan
pesan meski belum mengatur provider email. Koleksi ini:

- Tidak punya jalur baca/tulis apa pun untuk client di Firestore Rules
  (`allow read, write: if false`), termasuk untuk admin — satu-satunya
  penulis adalah server lewat Admin SDK.
- Tidak ditampilkan di UI publik maupun admin versi ini (lihat
  "Keterbatasan" di README) — bisa dibaca manual lewat Firebase Console bila
  diperlukan, atau ditambahkan sebagai halaman admin read-only di iterasi
  berikutnya.
- Body pesan dan IP mentah **tidak pernah** ditulis ke log server; hanya
  hash SHA-256 (16 karakter pertama) dari identitas klien yang disimpan,
  untuk keperluan review pola abuse.

## Rate limiting

Rate limiter saat ini adalah **in-memory, per-instance** (lihat
`src/lib/security/rate-limit.ts`). Ini cukup untuk deployment single-instance
atau traffic rendah, tetapi **tidak** terbagi antar instance pada deployment
serverless multi-instance (mis. beberapa concurrent invocation di Vercel).
Untuk production dengan traffic signifikan, ganti implementasi `store` di
file tersebut dengan backend bersama (Upstash Redis, Vercel KV, atau counter
Firestore dengan transaction) — interface-nya sengaja dibuat kecil agar
penggantian ini satu file saja.

## Keputusan desain lain yang didokumentasikan

- **SVG tidak diizinkan** untuk upload gambar (hanya PNG/JPEG/WebP/AVIF),
  karena SVG dapat membawa `<script>` dan merupakan vektor stored-XSS yang
  umum.
- **Nama file upload selalu diganti dengan UUID acak**, bukan nama asli dari
  pengguna — mencegah path traversal dan ekstensi executable.
- MIME type divalidasi dari **magic bytes** file, bukan hanya `Content-Type`
  yang dilaporkan browser atau ekstensi nama file.
