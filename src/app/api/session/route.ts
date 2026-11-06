import { NextResponse, type NextRequest } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME, UnauthorizedError } from "@/lib/firebase/auth";
import { isTrustedOrigin } from "@/lib/security/origin";
import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";

const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

/**
 * Exchanges a Firebase ID token (obtained client-side via the Firebase
 * client SDK, e.g. signInWithEmailAndPassword) for an HttpOnly session
 * cookie. This is the ONLY place the session cookie is minted.
 */
export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req.headers)) {
    return NextResponse.json({ ok: false, error: "Origin tidak dipercaya." }, { status: 403 });
  }

  const clientId = getClientIdentifier(req.headers);
  const rate = checkRateLimit(`login:${clientId}`, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Terlalu banyak percobaan login. Coba lagi nanti." }, { status: 429 });
  }

  let body: { idToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body permintaan tidak valid." }, { status: 400 });
  }

  if (!body.idToken || typeof body.idToken !== "string") {
    return NextResponse.json({ ok: false, error: "Token tidak ada." }, { status: 400 });
  }

  try {
    const { cookie, expiresInMs } = await createSessionCookie(body.idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });
    return response;
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
    }
    // Firebase Admin throws its own error shapes for expired/invalid tokens.
    return NextResponse.json({ ok: false, error: "Autentikasi gagal." }, { status: 401 });
  }
}

/** Logout: clears the session cookie. Also requires a trusted origin so a
 * third-party page can't force-logout a visitor as a nuisance CSRF. */
export async function DELETE(req: NextRequest) {
  if (!isTrustedOrigin(req.headers)) {
    return NextResponse.json({ ok: false, error: "Origin tidak dipercaya." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
