import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Awesome Project")).toBe("my-awesome-project");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Project #1: Rebuild!")).toBe("project-1-rebuild");
  });

  it("collapses repeated separators and trims hyphens", () => {
    expect(slugify("  --Spaced Out--  ")).toBe("spaced-out");
  });
});
