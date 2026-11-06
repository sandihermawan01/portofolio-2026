# Skema Database (Firestore)

## `site/profile` (single document)

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | ya | |
| `role` | string | ya | |
| `bio` | string | ya | maks 2000 karakter |
| `location` | string | tidak | |
| `avatarUrl` | string (https URL) | tidak | hasil upload ke Cloudinary, folder `avatars/` |
| `skills` | string[] | tidak | maks 40 item |
| `socialLinks` | `{ id, label, url }[]` | tidak | maks 12 item |
| `updatedAt` | Timestamp (server) | auto | diisi server saat setiap write |

## `site/contact` (single document)

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `email` | string (email) | ya | email kontak publik |
| `location` | string | tidak | |
| `socialLinks` | `{ id, label, url }[]` | tidak | maks 12 item, terpisah dari social link profil |
| `updatedAt` | Timestamp (server) | auto | |

## `experiences/{experienceId}`

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `title` | string | ya | posisi/jabatan |
| `company` | string | ya | |
| `employmentType` | enum | ya | `full-time` \| `part-time` \| `contract` \| `freelance` \| `internship` \| `volunteer` |
| `location` | string | tidak | |
| `startDate` | string (ISO date) | ya | |
| `endDate` | string (ISO date) | kondisional | wajib diisi **kecuali** `isCurrent: true` |
| `isCurrent` | boolean | ya | |
| `description` | string | ya | maks 4000 karakter |
| `skills` | string[] | tidak | maks 30 item |
| `sortOrder` | number | ya | tie-breaker saat `startDate` sama; publik selalu diurutkan current → terbaru → `sortOrder` |
| `createdAt`, `updatedAt` | Timestamp (server) | auto | |

**Index**: tidak memerlukan composite index khusus — koleksi kecil, diurutkan
di kode aplikasi (lihat `src/features/experience/queries.ts`).

## `projects/{projectId}`

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `title` | string | ya | |
| `slug` | string | ya, unik | hanya huruf kecil, angka, strip (`^[a-z0-9]+(-[a-z0-9]+)*$`); keunikan dicek di application layer (`isSlugTaken`) sebelum create/update |
| `summary` | string | ya | maks 200 karakter |
| `description` | string | ya | maks 8000 karakter |
| `coverImageUrl` | string (https URL) | tidak | hasil upload ke Cloudinary, folder `projects/` |
| `gallery` | string[] (https URL) | tidak | maks 20 item, juga di Cloudinary folder `projects/` |
| `technologies` | string[] | tidak | maks 30 item |
| `liveUrl` | string (https URL) | tidak | |
| `repositoryUrl` | string (https URL) | tidak | |
| `featured` | boolean | ya | default `false` |
| `status` | enum | ya | `draft` \| `published` — **draft tidak pernah terlihat publik**, ditegakkan di query (`getPublishedProjects`) **dan** Firestore Rules |
| `sortOrder` | number | ya | |
| `createdAt`, `updatedAt` | Timestamp (server) | auto | |

**Index** (`firebase/firestore.indexes.json`):
- `status ASC, featured DESC, sortOrder ASC` — untuk listing publik.
- `slug ASC` — untuk lookup detail project by slug.

## `messages/{messageId}` — submission contact form

| Field | Type | Keterangan |
|---|---|---|
| `name` | string | |
| `email` | string | |
| `message` | string | |
| `status` | string | selalu `"new"` saat dibuat; field disediakan untuk workflow triase manual di masa depan |
| `ipHash` | string | SHA-256(16 char) dari identifier klien — **bukan** IP mentah |
| `createdAt` | Timestamp (server) | |

Tidak ada jalur baca/tulis client (publik maupun admin) untuk koleksi ini di
Firestore Rules — lihat `docs/ARCHITECTURE.md` bagian "Penyimpanan pesan
contact form".

## Konvensi umum

- Semua `updatedAt`/`createdAt` memakai `FieldValue.serverTimestamp()` —
  tidak pernah dipercaya dari input client.
- Semua URL (avatar, cover, gallery, liveUrl, repositoryUrl, social link)
  divalidasi hanya menerima protokol `http`/`https` (lihat
  `src/lib/validations/common.ts`) untuk mencegah injeksi `javascript:`.
- Validasi skema (Zod) di `src/lib/validations/*` adalah **satu-satunya**
  sumber kebenaran bentuk data, dipakai identik di client (react-hook-form)
  maupun di Server Action — lihat `tests/unit/validations.test.ts`.
