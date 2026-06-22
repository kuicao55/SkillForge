import fs from 'fs-extra';
import path from 'node:path';
import { type Skill, type SkillCategory, type SkillSource } from '../../types/skill.js';
import { getSkillSourceDirs } from '../../utils/paths.js';
import { parseSkillMd, isSkillDir } from './parser.js';

/** A skill paired with its source category */
export interface SkillItem {
  skill: Skill;
  source: SkillSource;
}

/**
 * Discover all skills across Personal, Community, and Experimental directories.
 */
export async function discoverSkills(): Promise<SkillCategory> {
  const dirs = getSkillSourceDirs();

  const [personal, community, curated, experimental] = await Promise.all([
    scanDirForSkills(dirs.personal, 'personal'),
    scanDirForSkills(dirs.community, 'community'),
    scanDirForSkills(dirs.curated, 'curated'),
    scanDirForSkills(dirs.experimental, 'experimental'),
  ]);

  return { personal, community, curated, experimental };
}

/**
 * Find a skill by name across all source directories.
 */
export async function findSkill(name: string): Promise<Skill | null> {
  const all = await discoverSkills();
  const allSkills = [...all.personal, ...all.community, ...all.curated, ...all.experimental];
  return allSkills.find(s => s.metadata.name === name) || null;
}

/**
 * Scan a directory recursively for SKILL.md files.
 */
async function scanDirForSkills(
  dirPath: string,
  _source: 'personal' | 'community' | 'curated' | 'experimental',
): Promise<Skill[]> {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const skills: Skill[] = [];

  async function scan(dir: string) {
    // Check if current dir is a skill
    if (await isSkillDir(dir)) {
      const skill = await parseSkillMd(path.join(dir, 'SKILL.md'));
      if (skill) {
        skills.push(skill);
      }
      return; // Don't recurse into skill directories
    }

    // Recurse into subdirectories
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scan(path.join(dir, entry.name));
        }
      }
    } catch {
      // Permission errors etc — skip silently
    }
  }

  await scan(dirPath);
  return skills;
}

/** Get all unique tags with their skill counts. */
export async function findAllTags(): Promise<Map<string, number>> {
  const all = await discoverSkills();
  const allSkills = [...all.personal, ...all.community, ...all.curated, ...all.experimental];
  const tagMap = new Map<string, number>();
  for (const skill of allSkills) {
    for (const tag of skill.metadata.tags || []) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return tagMap;
}

/** Find all skills that have a specific tag. */
export async function findSkillsByTag(tag: string): Promise<SkillItem[]> {
  const all = await discoverSkills();
  const categories: [Skill[], SkillSource][] = [
    [all.personal, 'personal'],
    [all.community, 'community'],
    [all.curated, 'curated'],
    [all.experimental, 'experimental'],
  ];
  const result: SkillItem[] = [];
  for (const [skills, source] of categories) {
    for (const skill of skills) {
      if (skill.metadata.tags?.includes(tag)) {
        result.push({ skill, source });
      }
    }
  }
  return result;
}
