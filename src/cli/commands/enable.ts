import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { enableSkillGlobally, disableSkillGlobally } from '../../core/link/manager.js';
import { log } from '../../utils/logger.js';
import type { LinkDestination } from '../../types/destination.js';

export async function enableCommand(skillName: string, destination: LinkDestination): Promise<void> {
  console.log(chalk.bold(`\n⚒  Enabling skill globally: ${skillName}\n`));

  const skill = await findSkill(skillName);
  if (!skill) {
    log.error(`Skill "${skillName}" not found.`);
    return;
  }

  try {
    const symlinkPaths = await enableSkillGlobally(skillName, skill.path, destination);
    log.success(`Enabled ${chalk.bold(skillName)} globally for ${chalk.cyan(destination)}`);
    for (const p of symlinkPaths) {
      log.muted(`  Link: ${p}`);
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

export async function disableCommand(skillName: string, destination: LinkDestination): Promise<void> {
  console.log(chalk.bold(`\n⚒  Disabling skill globally: ${skillName}\n`));

  try {
    await disableSkillGlobally(skillName, destination);
    log.success(`Disabled ${chalk.bold(skillName)} globally for ${chalk.cyan(destination)}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
