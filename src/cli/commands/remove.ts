import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { getEntry, unregisterSkill } from '../../core/registry/manager.js';
import { getSkillSourceDirs } from '../../utils/paths.js';
import { log } from '../../utils/logger.js';

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

  // Check for active links
  const entry = await getEntry(name);
  if (entry && entry.links.length > 0) {
    log.warn(`Skill "${name}" has ${entry.links.length} active link(s):`);
    for (const link of entry.links) {
      log.muted(`  → ${link.agent}: ${link.symlinkPath}`);
    }
    log.warn('Remove the links first with: skillforge unlink');
    return;
  }

  // Remove directory
  const communityDir = getSkillSourceDirs().community;
  const skillDir = path.join(communityDir, name);
  await fs.remove(skillDir);

  // Remove from registry
  await unregisterSkill(name);

  log.success(`Skill "${name}" removed from Community/`);
}
