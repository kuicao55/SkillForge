import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { findAgent, loadAgents } from '../../core/agent/manager.js';
import { linkSkill } from '../../core/link/manager.js';
import { getProjectsRoot } from '../../core/config/index.js';
import { directoryBrowser } from '../prompts/directory-browser.js';
import { selectPrompt } from '../prompts/select.js';
import { confirmPrompt } from '../prompts/confirm.js';
import { log } from '../../utils/logger.js';

const customSelect = selectPrompt<string>();
const customConfirm = confirmPrompt();

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
      const rootDir = await getProjectsRoot();

      // Loop until user confirms a project
      let confirmed = false;
      while (!confirmed) {
        const selected = await directoryBrowser({
          message: 'Select project directory:',
          rootDir,
        });

        const result = await customConfirm({
          message: `Link to this project?\n  ${chalk.gray(selected)}`,
        });

        if (result === null) return; // ESC from confirm
        confirmed = result;

        if (confirmed) {
          projectPath = selected;
        }
      }
    }

    if (!agentName) {
      const agentChoices = agents.map(a => ({
        name: `${a.config.icon ? a.config.icon + ' ' : ''}${a.config.name} (${a.config.type})`,
        value: a.config.name,
      }));

      const result = await customSelect({
        message: 'Select agent:',
        choices: agentChoices,
      });

      if (result === null) return; // ESC
      agentName = result;
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
