import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Lang = "id" | "en";

// Lives only for this server instance's lifetime (resets on redeploy/cold
// start) — good enough to cut down repeat calls within one running
// process. Nothing here needs to survive a restart.
const cache = new Map<string, string>();

const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

// MyMemory's `langpair` has no "auto-detect" option — both sides are
// mandatory ISO codes. Since this site's existing copy is a genuine mix of
// Indonesian and English (admin-entered content, UI strings written at
// different times), each string's source has to be guessed per-string
// rather than assumed for the whole page. A tiny stopword-overlap heuristic
// is enough for most of this, but short strings with zero recognized words
// on EITHER side (an all-caps section header like "EXPERIENCE", a bare
// label like "Lihat Project") need their specific vocabulary listed below
// rather than relying on the tie-break — flipping the tie-break itself to
// favor "id" (an earlier attempt at this) fixed Indonesian-but-no-stopword
// labels only by breaking the mirror-image case: English section headers
// and labels with no stopword either (EXPERIENCE, Contract, Web Developer)
// started getting misread as "id" and silently skipped. So the tie-break
// stays "en" (this site's original default), and both lists below are kept
// stocked with the actual short/bare words this site uses on either side.
const ID_STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "ini", "itu", "saya", "kamu", "dengan", "untuk", "tidak", "ada",
  "akan", "bisa", "adalah", "atau", "juga", "saja", "pada", "dalam", "karena", "sudah", "belum", "tapi",
  "tetapi", "kalau", "jika", "nya", "lagi", "masih", "sangat", "sedang", "sebagai", "oleh", "seperti",
  "dapat", "harus", "tersebut", "bukan", "kami", "mereka", "kita", "punya", "banyak", "semua",
  // Common short action/UI vocabulary — the kind of word a button label or
  // heading is built from, with no classic stopword in sight.
  "lihat", "hubungi", "kirim", "simpan", "hapus", "tambah", "ubah", "ganti", "buka", "tutup", "kembali",
  "selesai", "batal", "proyek", "pengalaman", "keahlian", "tentang", "kontak", "beranda", "sekarang",
  "aktif", "jeda", "direncanakan", "aktifkan", "matikan", "pengaturan", "tampilan", "bahasa", "masuk",
  "keluar", "daftar", "cari", "unggah", "unduh", "publikasikan", "muncul", "dipublikasikan", "artikel",
  "skala", "warna", "deskripsi", "ringkas", "ringkasan", "status", "jenis", "ukuran", "urutan",
]);
const EN_STOPWORDS = new Set([
  "the", "and", "is", "are", "was", "were", "this", "that", "with", "for", "not", "have", "has", "had",
  "will", "would", "can", "could", "should", "a", "an", "of", "to", "in", "on", "at", "it", "as", "be",
  "or", "but", "if", "i", "you", "we", "my", "your", "from", "into", "about", "building", "working",
  // This site's own short English section headers/labels — bare nouns with
  // no classic stopword in them at all, so without listing them explicitly
  // they'd fall through to the tie-break instead of being recognized.
  "experience", "project", "projects", "skill", "skills", "repo", "web", "developer", "contract",
  "freelance", "internship", "volunteer", "currently", "developing", "selected", "index", "home",
  "settings", "search", "contact", "github", "activity", "latest", "commits", "now", "admin",
]);

function guessLang(text: string): Lang {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let idScore = 0;
  let enScore = 0;
  for (const w of words) {
    if (ID_STOPWORDS.has(w)) idScore++;
    if (EN_STOPWORDS.has(w)) enScore++;
  }
  if (idScore === enScore) {
    // A tie with signals on BOTH sides (e.g. "Project Selesai" — an
    // English noun plus a recognized Indonesian word) is a mixed label
    // built on Indonesian structure with a borrowed English word, so it
    // leans "id". A tie with NO signal at all (neither list matched
    // anything — a short English header like "EXPERIENCE", or any other
    // unlisted word) keeps the original "en" default, since that's this
    // site's safer fallback for a genuinely unrecognized short string.
    return idScore > 0 ? "id" : "en";
  }
  return idScore > enScore ? "id" : "en";
}

// MyMemory's free/anonymous tier rejects (or silently mangles) requests
// past roughly 500 characters — job/project descriptions, GitHub bios and
// the Contact page body routinely run longer than that, which is why those
// sections were coming back untranslated instead of erroring loudly.
const MAX_CHARS = 480;

/** Splits on sentence boundaries first, and only hard-slices a "sentence"
 * that is itself still too long (a long run-on line with no punctuation),
 * so a paragraph is never silently dropped for being over the limit. */
function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current);
      if (sentence.length > maxLen) {
        for (let i = 0; i < sentence.length; i += maxLen) {
          chunks.push(sentence.slice(i, i + maxLen));
        }
        current = "";
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk: string, source: Lang, target: Lang): Promise<string | null> {
  const key = `${source}|${target}:${chunk}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({ q: chunk, langpair: `${source}|${target}` });
  const res = await fetch(`${MYMEMORY_ENDPOINT}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };
  // MyMemory often answers with HTTP 200 even when it failed (length limit
  // exceeded, rate limit, etc.) and puts the real status inside the body
  // instead — treating any non-200 `responseStatus` as a failure stops
  // MyMemory's own error string from ever being shown as if it were the
  // translated copy.
  const status = Number(json.responseStatus ?? 200);
  if (status !== 200) return null;
  const translated = json.responseData?.translatedText;
  if (!translated) return null;

  cache.set(key, translated);
  return translated;
}

async function translateOne(text: string, target: Lang): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const source = guessLang(trimmed);
  if (source === target) return text; // already in the target language — nothing to do

  const key = `${source}|${target}:${trimmed}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const chunks = splitIntoChunks(trimmed, MAX_CHARS);
    const translatedChunks = await Promise.all(chunks.map((c) => translateChunk(c, source, target)));
    // Any failed chunk — bail out to the original text rather than show a
    // paragraph that's half-translated and half not.
    if (translatedChunks.some((c) => c === null)) return text;
    const translated = translatedChunks.join("");
    cache.set(key, translated);
    return translated;
  } catch {
    return text; // translation is a nice-to-have; never break the page over it
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { texts?: unknown; target?: unknown } | null;

  if (!body || !Array.isArray(body.texts) || (body.target !== "id" && body.target !== "en")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Capped per request so one huge page (or a bug) can't fan out into an
  // unbounded number of upstream calls — the client already chunks its
  // requests well under this.
  const texts = body.texts.filter((t): t is string => typeof t === "string").slice(0, 100);
  const target = body.target as Lang;

  const translations = await Promise.all(texts.map((t) => translateOne(t, target)));
  return NextResponse.json({ translations });
}
