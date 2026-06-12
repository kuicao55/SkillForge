import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { findAgent } from '../../core/agent/manager.js';
import { linkSkill, unlinkSkill } from '../../core/link/manager.js';
import { log } from '../../utils/logger.js';

interface LinkOptions {
  agent: string;
  project: string;
}

export async function linkCommand(skillName: string, options: LinkOptions): Promise<void> {
  console.log(chalk.bold(`\n⚒  Linking skill: ${skillName}\n`));

  // Find skill
  const skill = await findSkill(skillName);
  if (!skill) {
    log.error(`Skill "${skillName}" not found.`);
    return;
  }

  // Find agent
  const agent = await findAgent(options.agent);
  if (!agent) {
    log.error(`Agent "${options.agent}" not found. Run "skillforge agents" to see available agents.`);
    return;
  }

  // Create link
  try {
    const symlinkPath = await linkSkill(skillName, skill.path, agent, options.project);
    log.success(`Linked ${chalk.bold(skillName)} → ${chalk.cyan(options.agent)} (${symlinkPath})`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

export async function unlinkCommand(skillName: string, options: LinkOptions): Promise<void> {
  console.log(chalk.bold(`\n⚒  Unlinking skill: ${skillName}\n`));

  const agent = await findAgent(options.agent);
  if (!agent) {
    log.error(`Agent "${options.agent}" not found.`);
    return;
  }

  try {
    await unlinkSkill(skillName, agent, options.project);
    log.success(`Unlinked ${chalk.bold(skillName)} from ${chalk.cyan(options.agent)}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
