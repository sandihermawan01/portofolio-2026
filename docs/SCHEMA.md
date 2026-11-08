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

## `github/config` (single document) — pengaturan GitHub Activity

Dikelola lewat Admin Dashboard (`/admin/github`); lihat
`docs/ARCHITECTURE.md` bagian "GitHub Activity" untuk desain lengkapnya.

| Field | Type | Keterangan |
|---|---|---|
| `username` | string \| undefined | akun GitHub untuk contribution heatmap; string kosong dari form dianggap "belum diset" |
| `selectedRepos` | array (maks. 12) | lihat tabel di bawah |
| `selectedRepos[].owner` | string | pemilik repo di GitHub |
| `selectedRepos[].repo` | string | nama repo |
| `selectedRepos[].status` | enum | `"active" \| "planning" \| "paused" \| "completed"` — murni input admin, GitHub tidak punya konsep ini |
| `selectedRepos[].sortOrder` | number | urutan tampil di "Currently Developing" |
| `widgetVisible` | boolean | default `false`; saklar utama untuk halaman publik `/github` |
| `updatedAt` | Timestamp (server) | |

Hanya field di atas yang disimpan di `selectedRepos` — nama, deskripsi,
bahasa, topics, dan URL repo **tidak** disimpan di sini; semua itu diambil
otomatis dari GitHub API saat sync dan disimpan di `github/cache` di bawah.

## `github/cache` (single document) — hasil sync GitHub, machine-written

**Tidak pernah ditulis lewat client SDK oleh siapa pun, termasuk admin** —
satu-satunya penulis adalah Admin SDK dari `syncGithubActivity()`
(`src/lib/github/sync.ts`), dipanggil dari cron, webhook, atau tombol
"Sync Now". Lihat `firebase/firestore.rules`.

| Field | Type | Keterangan |
|---|---|---|
| `contributions` | object \| null | `{ totalContributions, weeks: [{ days: [{ date, count, level }] }] }`; `level` (0–4) dihitung di server dari kuartil jumlah kontribusi |
| `contributionsFetchedAt` | Timestamp (server) \| null | |
| `repos` | array | metadata repo terpilih, diurutkan oleh `sortOrder` — lihat tabel di bawah |
| `repos[].owner`, `.repo`, `.status`, `.sortOrder` | — | disalin dari `github/config.selectedRepos` saat sync |
| `repos[].name`, `.description`, `.language`, `.topics`, `.url`, `.updatedAt`, `.pushedAt` | — | diambil langsung dari GitHub REST API |
| `reposFetchedAt` | Timestamp (server) \| null | |
| `commits` | array (maks. 3) | tepat 3 commit terbaru lintas seluruh `selectedRepos`, diurutkan `committedAt` descending |
| `commits[].repoFullName`, `.sha`, `.shortSha`, `.message`, `.url`, `.committedAt` | — | |
| `commitsFetchedAt` | Timestamp (server) \| null | |
| `lastSyncedAt` | Timestamp (server) \| null | dipakai UI publik untuk menghitung "data mungkin tidak terbaru" bersama `GITHUB_SYNC_CACHE_TTL_MINUTES` |
| `lastSyncErrors` | string[] | error non-fatal dari sync terakhir, per bagian — tidak pernah memuat token mentah |

Setiap field `*FetchedAt`/`contributions`/`repos`/`commits` hanya ditimpa
saat fetch bagian itu **berhasil** — kegagalan satu bagian mempertahankan
nilai cache sebelumnya (lihat "Fallback-on-failure" di
`docs/ARCHITECTURE.md`).

## Konvensi umum

- Semua `updatedAt`/`createdAt` memakai `FieldValue.serverTimestamp()` —
  tidak pernah dipercaya dari input client.
- Semua URL (avatar, cover, gallery, liveUrl, repositoryUrl, social link)
  divalidasi hanya menerima protokol `http`/`https` (lihat
  `src/lib/validations/common.ts`) untuk mencegah injeksi `javascript:`.
- Validasi skema (Zod) di `src/lib/validations/*` adalah **satu-satunya**
  sumber kebenaran bentuk data, dipakai identik di client (react-hook-form)
  maupun di Server Action — lihat `tests/unit/validations.test.ts`.
