import type { ProfileInput, ContactInfoInput } from "@/lib/validations/profile";
import type { ExperienceInput } from "@/lib/validations/experience";
import type { ProjectInput } from "@/lib/validations/project";
import type { NowInput } from "@/lib/validations/now";
import type { SocialLink } from "@/lib/validations/common";

export type { SocialLink };

/** Firestore doc `site/profile`, plus server-managed fields. */
export interface Profile extends ProfileInput {
  updatedAt: string; // ISO string, converted from Firestore Timestamp at the data layer
}

/** Firestore doc `site/contact`, plus server-managed fields. */
export interface ContactInfo extends ContactInfoInput {
  updatedAt: string;
}

/** Firestore doc `experiences/{id}`. */
export interface Experience extends ExperienceInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Firestore doc `projects/{id}`. */
export interface Project extends ProjectInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Firestore doc `site/now`. */
export interface NowContent extends NowInput {
  updatedAt: string;
}

export interface DashboardStats {
  publishedProjectCount: number;
  draftProjectCount: number;
  experienceCount: number;
}
