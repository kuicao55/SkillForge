import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { findAgent } from '../../core/agent/manager.js';
import { enableSkillGlobally, disableSkillGlobally } from '../../core/link/manager.js';
import { log } from '../../utils/logger.js';

export async function enableCommand(skillName: string, agentName: string): Promise<void> {
  console.log(chalk.bold(`\n⚒  Enabling skill globally: ${skillName}\n`));

  const skill = await findSkill(skillName);
  if (!skill) {
    log.error(`Skill "${skillName}" not found.`);
    return;
  }

  const agent = await findAgent(agentName);
  if (!agent) {
    log.error(`Agent "${agentName}" not found.`);
    return;
  }

  try {
    const symlinkPath = await enableSkillGlobally(skillName, skill.path, agent);
    log.success(`Enabled ${chalk.bold(skillName)} globally for ${chalk.cyan(agentName)}`);
    log.muted(`  Link: ${symlinkPath}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

export async function disableCommand(skillName: string, agentName: string): Promise<void> {
  console.log(chalk.bold(`\n⚒  Disabling skill globally: ${skillName}\n`));

  const agent = await findAgent(agentName);
  if (!agent) {
    log.error(`Agent "${agentName}" not found.`);
    return;
  }

  try {
    await disableSkillGlobally(skillName, agent);
    log.success(`Disabled ${chalk.bold(skillName)} globally for ${chalk.cyan(agentName)}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
