// Shared skill-level constants: the enum, its display order/labels, and the
// weight used to turn a level into a pie-chart-ready percentage.

export const SKILL_LEVELS = ["newbie", "intermediate", "proper", "profesional"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  newbie: "Newbie",
  intermediate: "Intermediate",
  proper: "Proper",
  profesional: "Profesional",
};

// Higher weight = bigger slice. Adjust here if the mastery order should change.
const SKILL_LEVEL_WEIGHT: Record<SkillLevel, number> = {
  newbie: 1,
  intermediate: 2,
  proper: 3,
  profesional: 4,
};

// Higher level = brighter shade. Shared by anything that colors a skill by
// its level (the tech stack pie chart and its level-scale legend), so the
// same level always reads as the same brightness everywhere on the page.
export const SKILL_LEVEL_SHADE: Record<SkillLevel, number> = {
  newbie: 0.3,
  intermediate: 0.52,
  proper: 0.76,
  profesional: 1,
};

export interface SkillEntry {
  name: string;
  level: SkillLevel;
}

export interface SkillWithShare extends SkillEntry {
  percentage: number;
}

/** Converts each skill's level into a percentage share that always sums to ~100%. */
export function withSkillShares(skills: SkillEntry[]): SkillWithShare[] {
  const totalWeight = skills.reduce((sum, s) => sum + SKILL_LEVEL_WEIGHT[s.level], 0) || 1;
  return skills.map((s) => ({
    ...s,
    percentage: Math.round((SKILL_LEVEL_WEIGHT[s.level] / totalWeight) * 1000) / 10,
  }));
}
