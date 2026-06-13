import chalk from 'chalk';
import { findAgent } from '../../core/agent/manager.js';
import { unlinkSkill } from '../../core/link/manager.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { selectPrompt } from '../prompts/select.js';
import { log } from '../../utils/logger.js';

const customSelect = selectPrompt<string>();

interface UnlinkOptions {
  agent?: string;
  project?: string;
}

export async function unlinkCommand(skillName: string, options: UnlinkOptions): Promise<void> {
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
        const result = await customSelect({
          message: 'Select project to unlink from:',
          choices: projects.map(p => ({
            name: p === '__global__' ? 'global' : p,
            value: p,
          })),
        });
        if (result === null) return; // ESC
        projectPath = result;
      }
    }

    // Get agents linked in this project
    const agentsInProject = projectMap.get(projectPath) || [];

    if (!agentName) {
      if (agentsInProject.length === 1) {
        agentName = agentsInProject[0];
      } else {
        const result = await customSelect({
          message: 'Select agent to unlink:',
          choices: agentsInProject.map(a => ({ name: a, value: a })),
        });
        if (result === null) return; // ESC
        agentName = result;
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
