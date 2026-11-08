import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyGithubWebhookSignature } from "@/lib/github/webhook";

const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ ref: "refs/heads/main", repository: { full_name: "zsans/portfolio" } });

function sign(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

describe("verifyGithubWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    const signature = sign(BODY, SECRET);
    expect(verifyGithubWebhookSignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret", () => {
    const signature = sign(BODY, "a-different-secret");
    expect(verifyGithubWebhookSignature(BODY, signature, SECRET)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const signature = sign(BODY, SECRET);
    const tamperedBody = BODY.replace("main", "evil-branch");
    expect(verifyGithubWebhookSignature(tamperedBody, signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyGithubWebhookSignature(BODY, null, SECRET)).toBe(false);
  });

  it("rejects a malformed signature header", () => {
    expect(verifyGithubWebhookSignature(BODY, "not-a-valid-signature", SECRET)).toBe(false);
  });

  it("rejects an empty signature header", () => {
    expect(verifyGithubWebhookSignature(BODY, "", SECRET)).toBe(false);
  });
});
