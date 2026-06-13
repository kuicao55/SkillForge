import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { getEntry, unregisterSkill } from '../../core/registry/manager.js';
import { unlinkSkill } from '../../core/link/manager.js';
import { getSkillSourceDirs } from '../../utils/paths.js';
import { log } from '../../utils/logger.js';
import type { LinkDestination } from '../../types/destination.js';

export async function removeCommand(name: string): Promise<void> {
  console.log(chalk.bold(`\n⚒  Removing skill: ${name}\n`));

  const skill = await findSkill(name);
  if (!skill) {
    log.error(`Skill "${name}" not found.`);
    return;
  }

  if (skill.metadata.source !== 'community') {
    log.error(`Can only remove community skills. "${name}" is ${skill.metadata.source}.`);
    return;
  }

  // Auto-unlink all active links
  const entry = await getEntry(name);
  if (entry && entry.links.length > 0) {
    log.muted(`Unlinking ${entry.links.length} active link(s)...`);

    // Group links by projectPath + destination for efficient unlinking
    const unlinkSet = new Set<string>();
    for (const link of entry.links) {
      unlinkSet.add(`${link.projectPath}\0${link.destination}`);
    }

    for (const key of unlinkSet) {
      const [projectPath, destination] = key.split('\0');
      try {
        await unlinkSkill(name, destination as LinkDestination, projectPath);
        log.success(`  Unlinked from ${destination} @ ${projectPath === '__global__' ? 'global' : projectPath}`);
      } catch (err) {
        log.warn(`  Failed to unlink from ${destination} @ ${projectPath}: ${err}`);
      }
    }
  }

  // Remove directory
  const communityDir = getSkillSourceDirs().community;
  const skillDir = path.join(communityDir, name);
  if (await fs.pathExists(skillDir)) {
    await fs.remove(skillDir);
  }

  // Remove from registry
  await unregisterSkill(name);

  log.success(`Skill "${name}" removed from Community/`);
}
