import fs from 'fs-extra';
import matter from 'gray-matter';
import path from 'node:path';
import { type Skill, type SkillMetadata, type SkillSource, SkillMetadataSchema } from '../../types/skill.js';

const SKILL_MD = 'SKILL.md';

/**
 * Parse a SKILL.md file and extract metadata + content.
 */
export async function parseSkillMd(skillMdPath: string): Promise<Skill | null> {
  try {
    const raw = await fs.readFile(skillMdPath, 'utf-8');
    const { data } = matter(raw);

    // Infer source from path
    const source = inferSource(skillMdPath);

    // Validate and merge metadata
    const metadata: SkillMetadata = {
      name: data.name || path.basename(path.dirname(skillMdPath)),
      description: data.description,
      source,
      package: data.package,
      version: data.version,
      author: data.author,
      tags: data.tags,
    };

    const parsed = SkillMetadataSchema.safeParse(metadata);
    if (!parsed.success) {
      return null;
    }

    return {
      metadata: parsed.data,
      path: path.dirname(skillMdPath),
      skillMdPath,
    };
  } catch {
    return null;
  }
}

/**
 * Infer skill source from its filesystem path.
 */
function inferSource(skillMdPath: string): SkillSource {
  const normalized = skillMdPath.replace(/\\/g, '/');
  if (normalized.includes('/Personal/')) return 'personal';
  if (normalized.includes('/Community/')) return 'community';
  if (normalized.includes('/Curated/')) return 'curated';
  if (normalized.includes('/Experimental/')) return 'experimental';
  return 'personal'; // default
}

/**
 * Check if a directory contains a SKILL.md file.
 */
export async function isSkillDir(dirPath: string): Promise<boolean> {
  return fs.pathExists(path.join(dirPath, SKILL_MD));
}
