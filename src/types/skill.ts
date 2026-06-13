import { z } from 'zod';

// --- Zod Schemas ---

export const SkillSourceSchema = z.enum(['personal', 'community', 'experimental']);
export type SkillSource = z.infer<typeof SkillSourceSchema>;

export const SkillMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  source: SkillSourceSchema.optional(),
  package: z.string().optional(), // npm package name, e.g. "lovstudio/md2pdf"
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

export const SkillSchema = z.object({
  metadata: SkillMetadataSchema,
  path: z.string(),
  skillMdPath: z.string(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const SkillCategorySchema = z.object({
  personal: z.array(SkillSchema),
  community: z.array(SkillSchema),
  experimental: z.array(SkillSchema),
});
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
