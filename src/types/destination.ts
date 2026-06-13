import { z } from 'zod';

// --- Zod Schemas ---

export const LinkDestinationSchema = z.enum(['claude', 'others', 'all']);
export type LinkDestination = z.infer<typeof LinkDestinationSchema>;

// Hardcoded universal skill directory paths
export const CLAUDE_SKILLS = '.claude/skills';
export const AGENTS_SKILLS = '.agents/skills';
export const CLAUDE_GLOBAL_SKILLS = '~/.claude/skills';
export const AGENTS_GLOBAL_SKILLS = '~/.agents/skills';
