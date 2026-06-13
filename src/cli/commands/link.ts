import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { linkSkill } from '../../core/link/manager.js';
import { getProjectsRoot } from '../../core/config/index.js';
import { directoryBrowser } from '../prompts/directory-browser.js';
import { selectPrompt } from '../prompts/select.js';
import { confirmPrompt } from '../prompts/confirm.js';
import { log } from '../../utils/logger.js';
import type { LinkDestination } from '../../types/destination.js';

const customSelect = selectPrompt<string>();
const customConfirm = confirmPrompt();

const DESTINATION_CHOICES = [
  { name: '🤖 Claude Code (.claude/skills)', value: 'claude' as const },
  { name: '🔧 Others (.agents/skills)', value: 'others' as const },
  { name: '🌐 All (both directories)', value: 'all' as const },
];

interface LinkOptions {
  destination?: LinkDestination;
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

  let destination = options.destination;
  let projectPath = options.project;

  // Interactive mode if args missing
  if (!destination || !projectPath) {
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

    if (!destination) {
      const result = await customSelect({
        message: 'Select destination:',
        choices: DESTINATION_CHOICES,
      });

      if (result === null) return; // ESC
      destination = result as LinkDestination;
    }
  }

  // Create link
  try {
    const symlinkPaths = await linkSkill(skillName, skill.path, destination, projectPath!);
    for (const p of symlinkPaths) {
      log.success(`Linked ${chalk.bold(skillName)} → ${chalk.cyan(destination)} (${p})`);
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
