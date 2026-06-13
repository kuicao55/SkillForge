import { z } from 'zod';

// --- Zod Schemas ---

export const AgentPathsSchema = z.object({
  project: z.string(),   // e.g. ".claude"
  global: z.string(),     // e.g. "~/.claude"
  skills: z.string(),     // e.g. "skills"
});
export type AgentPaths = z.infer<typeof AgentPathsSchema>;

export const LoadOrderSchema = z.enum(['project', 'global']);
export type LoadOrder = z.infer<typeof LoadOrderSchema>;

export const AgentConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  icon: z.string().optional(),
  paths: AgentPathsSchema,
  load_order: z.array(LoadOrderSchema),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const AgentDefinitionSchema = z.object({
  config: AgentConfigSchema,
  configPath: z.string(),
});
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
