import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { findSkill } from '../../core/skill/discovery.js';
import { findAgent, loadAgents, resolveProjectSkillsDir } from '../../core/agent/manager.js';
import { linkSkill, unlinkSkill } from '../../core/link/manager.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';
import fs from 'fs-extra';

interface LinkOptions {
  agent?: string;
  project?: string;
}

export async function linkCommand(skillName: string, options: LinkOptions): Promise<void> {
  console.log(chalk.bold(`\n⚒  Linking skill: ${skillName}\n`));

  // Find skill
  const skill = await findSkill(skillName);
  if (!skill) {
    log.error(`Skill "${skillName}" not found.`);
    return;
  }

  let agentName = options.agent;
  let projectPath = options.project;

  // Interactive mode if args missing
  if (!agentName || !projectPath) {
    const agents = await loadAgents();
    if (agents.length === 0) {
      log.error('No agents configured. Run "skill init" first.');
      return;
    }

    if (!projectPath) {
      // Prompt for project path
      projectPath = await select({
        message: 'Select project:',
        choices: [
          { name: 'Enter custom path', value: '__custom__' },
        ],
      });

      if (projectPath === '__custom__') {
        // For custom path, user needs to provide it via CLI arg
        log.error('Please provide project path: skill link <skill> -p <path>');
        return;
      }
    }

    if (!agentName) {
      // Prompt for agent
      const agentChoices = agents.map(a => ({
        name: `${a.config.icon ? a.config.icon + ' ' : ''}${a.config.name} (${a.config.type})`,
        value: a.config.name,
      }));

      agentName = await select({
        message: 'Select agent:',
        choices: agentChoices,
      });
    }
  }

  // Find agent
  const agent = await findAgent(agentName);
  if (!agent) {
    log.error(`Agent "${agentName}" not found. Run "skill agents" to see available agents.`);
    return;
  }

  // Create link
  try {
    const symlinkPath = await linkSkill(skillName, skill.path, agent, projectPath!);
    log.success(`Linked ${chalk.bold(skillName)} → ${chalk.cyan(agentName)} (${symlinkPath})`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

export async function unlinkCommand(skillName: string, options: LinkOptions): Promise<void> {
  console.log(chalk.bold(`\n⚒  Unlinking skill: ${skillName}\n`));

  const registry = await loadRegistry();
  const entry = registry.skills[skillName];

  if (!entry || entry.links.length === 0) {
    log.error(`Skill "${skillName}" has no active links.`);
    return;
  }

  let agentName = options.agent;
  let projectPath = options.project;

  // Interactive mode if args missing
  if (!agentName || !projectPath) {
    // Group links by project
    const projectMap = new Map<string, string[]>();
    for (const link of entry.links) {
      const proj = link.projectPath;
      if (!projectMap.has(proj)) {
        projectMap.set(proj, []);
      }
      projectMap.get(proj)!.push(link.agent);
    }

    const projects = Array.from(projectMap.keys());

    if (!projectPath) {
      if (projects.length === 1) {
        projectPath = projects[0];
      } else {
        projectPath = await select({
          message: 'Select project to unlink from:',
          choices: projects.map(p => ({
            name: p === '__global__' ? 'global' : p,
            value: p,
          })),
        });
      }
    }

    // Get agents linked in this project
    const agentsInProject = projectMap.get(projectPath) || [];

    if (!agentName) {
      if (agentsInProject.length === 1) {
        agentName = agentsInProject[0];
      } else {
        agentName = await select({
          message: 'Select agent to unlink:',
          choices: agentsInProject.map(a => ({ name: a, value: a })),
        });
      }
    }
  }

  const agent = await findAgent(agentName);
  if (!agent) {
    log.error(`Agent "${agentName}" not found.`);
    return;
  }

  try {
    await unlinkSkill(skillName, agent, projectPath!);
    log.success(`Unlinked ${chalk.bold(skillName)} from ${chalk.cyan(agentName)}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
