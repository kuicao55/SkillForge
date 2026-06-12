import { z } from 'zod';

// --- Zod Schemas ---

export const LinkRecordSchema = z.object({
  agent: z.string(),
  projectPath: z.string(),
  symlinkPath: z.string(),
  createdAt: z.string(),
});
export type LinkRecord = z.infer<typeof LinkRecordSchema>;

export const RegistryEntrySchema = z.object({
  name: z.string(),
  source: z.enum(['personal', 'community', 'experimental']),
  installPath: z.string(),
  installedAt: z.string(),
  links: z.array(LinkRecordSchema),
});
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;

export const RegistrySchema = z.object({
  version: z.number(),
  skills: z.record(z.string(), RegistryEntrySchema),
});
export type Registry = z.infer<typeof RegistrySchema>;
