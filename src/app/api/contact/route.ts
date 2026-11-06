import { NextResponse, type NextRequest } from "next/server";
import { submitContactForm } from "@/features/contact/actions";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body permintaan tidak valid." }, { status: 400 });
  }

  const result = await submitContactForm(body, req.headers);

  if (!result.ok) {
    const status = result.error?.includes("Terlalu banyak") ? 429 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 200 });
}

// Explicitly reject any other method instead of silently 404ing, so the
// behavior is intentional and documented.
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
