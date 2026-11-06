import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";
import { getPublishedProjects } from "@/features/projects/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/experience`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/project`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const projects = await getPublishedProjects();
  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${base}/project/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
