/**
 * Firestore Security Rules tests, run against the Firebase Emulator Suite.
 *
 * Run with: npm run test:rules
 * (wraps this in `firebase emulators:exec`, so a real emulator backs every
 * assertion below — these are not mocks).
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "portfolio-rules-test",
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("site/profile and site/contact", () => {
  it("allows anonymous read", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauthed.firestore(), "site/profile")));
  });

  it("denies anonymous write", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(unauthed.firestore(), "site/profile"), { name: "x", role: "x", bio: "x", skills: [], socialLinks: [] })
    );
  });

  it("denies write from an authenticated non-admin user", async () => {
    const user = testEnv.authenticatedContext("user-1", { admin: false });
    await assertFails(
      setDoc(doc(user.firestore(), "site/profile"), { name: "x", role: "x", bio: "x", skills: [], socialLinks: [] })
    );
  });

  it("allows write from an admin user", async () => {
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertSucceeds(
      setDoc(doc(admin.firestore(), "site/profile"), { name: "x", role: "x", bio: "x", skills: [], socialLinks: [] })
    );
  });
});

describe("experiences", () => {
  it("allows anonymous read", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauthed.firestore(), "experiences/exp-1")));
  });

  it("denies anonymous create", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(
      addDoc(collection(unauthed.firestore(), "experiences"), {
        title: "x",
        company: "x",
        startDate: "2024-01-01",
      })
    );
  });

  it("allows admin create", async () => {
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertSucceeds(
      addDoc(collection(admin.firestore(), "experiences"), {
        title: "x",
        company: "x",
        startDate: "2024-01-01",
      })
    );
  });

  it("allows admin delete", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "experiences/exp-1"), { title: "x", company: "x", startDate: "2024-01-01" });
    });
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertSucceeds(deleteDoc(doc(admin.firestore(), "experiences/exp-1")));
  });
});

describe("projects — draft vs published visibility", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "projects/draft-1"), {
        title: "Draft project",
        slug: "draft-project",
        status: "draft",
      });
      await setDoc(doc(ctx.firestore(), "projects/pub-1"), {
        title: "Published project",
        slug: "published-project",
        status: "published",
      });
    });
  });

  it("denies anonymous read of a draft project", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauthed.firestore(), "projects/draft-1")));
  });

  it("allows anonymous read of a published project", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauthed.firestore(), "projects/pub-1")));
  });

  it("allows admin read of a draft project", async () => {
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertSucceeds(getDoc(doc(admin.firestore(), "projects/draft-1")));
  });

  it("denies a non-admin from publishing a project", async () => {
    const user = testEnv.authenticatedContext("user-1", { admin: false });
    await assertFails(
      setDoc(doc(user.firestore(), "projects/draft-1"), {
        title: "Draft project",
        slug: "draft-project",
        status: "published",
      })
    );
  });

  it("rejects a malformed slug even from an admin", async () => {
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertFails(
      setDoc(doc(admin.firestore(), "projects/draft-1"), {
        title: "Draft project",
        slug: "Not A Valid Slug",
        status: "draft",
      })
    );
  });
});

describe("messages — never client-accessible", () => {
  it("denies anonymous read", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "messages/msg-1"), { name: "x", email: "x@x.com", message: "hi" });
    });
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauthed.firestore(), "messages/msg-1")));
  });

  it("denies admin client-side read too (admin UI doesn't read this collection; Admin SDK only)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "messages/msg-2"), { name: "x", email: "x@x.com", message: "hi" });
    });
    const admin = testEnv.authenticatedContext("admin-1", { admin: true });
    await assertFails(getDoc(doc(admin.firestore(), "messages/msg-2")));
  });

  it("denies anonymous write", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(
      addDoc(collection(unauthed.firestore(), "messages"), { name: "x", email: "x@x.com", message: "hi" })
    );
  });
});
