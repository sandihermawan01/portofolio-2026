import { describe, it, expect } from "vitest";
import { profileSchema, contactInfoSchema } from "@/lib/validations/profile";
import { experienceSchema } from "@/lib/validations/experience";
import { projectSchema } from "@/lib/validations/project";
import { contactFormSchema } from "@/lib/validations/contact";
import { slugSchema, httpsUrlSchema } from "@/lib/validations/common";

describe("profileSchema", () => {
  it("accepts a minimal valid profile", () => {
    const result = profileSchema.safeParse({
      name: "Zsans",
      role: "Full-Stack Engineer",
      bio: "Membangun hal-hal di web.",
      skills: [],
      socialLinks: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = profileSchema.safeParse({ name: "", role: "x", bio: "x", skills: [], socialLinks: [] });
    expect(result.success).toBe(false);
  });
});

describe("contactInfoSchema", () => {
  it("rejects an invalid email", () => {
    const result = contactInfoSchema.safeParse({ email: "not-an-email", socialLinks: [] });
    expect(result.success).toBe(false);
  });

  it("accepts a valid email with no socials", () => {
    const result = contactInfoSchema.safeParse({ email: "owner@example.com", socialLinks: [] });
    expect(result.success).toBe(true);
  });
});

describe("experienceSchema", () => {
  const base = {
    title: "Software Engineer",
    company: "Acme",
    employmentType: "full-time" as const,
    startDate: "2023-01-01",
    description: "Built things.",
    skills: [],
    sortOrder: 0,
  };

  it("requires endDate when isCurrent is false", () => {
    const result = experienceSchema.safeParse({ ...base, isCurrent: false });
    expect(result.success).toBe(false);
  });

  it("accepts a current role with no endDate", () => {
    const result = experienceSchema.safeParse({ ...base, isCurrent: true });
    expect(result.success).toBe(true);
  });

  it("rejects endDate before startDate", () => {
    const result = experienceSchema.safeParse({ ...base, isCurrent: false, endDate: "2022-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects an endDate when isCurrent is true", () => {
    const result = experienceSchema.safeParse({ ...base, isCurrent: true, endDate: "2024-01-01" });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const base = {
    title: "My Project",
    slug: "my-project",
    summary: "A short summary.",
    description: "A long description.",
    gallery: [],
    technologies: [],
    featured: false,
    status: "draft" as const,
    sortOrder: 0,
  };

  it("accepts a minimal valid project", () => {
    expect(projectSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an uppercase slug", () => {
    expect(projectSchema.safeParse({ ...base, slug: "My-Project" }).success).toBe(false);
  });

  it("rejects a slug with spaces", () => {
    expect(projectSchema.safeParse({ ...base, slug: "my project" }).success).toBe(false);
  });

  it("rejects status outside draft/published", () => {
    expect(projectSchema.safeParse({ ...base, status: "archived" }).success).toBe(false);
  });
});

describe("contactFormSchema", () => {
  it("accepts a valid submission", () => {
    const result = contactFormSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "Hello, I would like to get in touch!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a message that is too short", () => {
    const result = contactFormSchema.safeParse({ name: "Jane", email: "jane@example.com", message: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot field as invalid (never silently accepted at the schema layer)", () => {
    const result = contactFormSchema.safeParse({
      name: "Bot",
      email: "bot@example.com",
      message: "This is a long enough spam message.",
      website: "http://spam.example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("common schemas", () => {
  it("slugSchema rejects uppercase and underscores", () => {
    expect(slugSchema.safeParse("valid-slug-1").success).toBe(true);
    expect(slugSchema.safeParse("Invalid_Slug").success).toBe(false);
  });

  it("httpsUrlSchema rejects javascript: URLs", () => {
    expect(httpsUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("httpsUrlSchema accepts https URLs", () => {
    expect(httpsUrlSchema.safeParse("https://example.com").success).toBe(true);
  });
});
