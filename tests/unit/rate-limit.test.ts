import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-a`;
    const result = checkRateLimit(key, 3, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests once the limit is reached", () => {
    const key = `test-${Date.now()}-b`;
    checkRateLimit(key, 2, 60);
    checkRateLimit(key, 2, 60);
    const third = checkRateLimit(key, 2, 60);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-${Date.now()}-c1`;
    const keyB = `test-${Date.now()}-c2`;
    checkRateLimit(keyA, 1, 60);
    const resultA = checkRateLimit(keyA, 1, 60);
    const resultB = checkRateLimit(keyB, 1, 60);
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
