import type { Timestamp } from "firebase-admin/firestore";

/** Converts a Firestore Timestamp (or already-ISO string, or undefined) to
 * an ISO date string, defaulting to epoch-safe "now" only as a last resort
 * so callers never crash on a missing `updatedAt` on first write. */
export function timestampToIso(value: Timestamp | string | undefined | null): string {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  return value.toDate().toISOString();
}
