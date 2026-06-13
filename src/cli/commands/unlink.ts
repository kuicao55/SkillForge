import chalk from 'chalk';
import { unlinkSkill } from '../../core/link/manager.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { selectPrompt } from '../prompts/select.js';
import { log } from '../../utils/logger.js';
import type { LinkDestination } from '../../types/destination.js';

const customSelect = selectPrompt<string>();

interface UnlinkOptions {
  destination?: LinkDestination;
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

  let destination = options.destination;
  let projectPath = options.project;

  // Interactive mode if args missing
  if (!destination || !projectPath) {
    // Group links by project
    const projectMap = new Map<string, LinkDestination[]>();
    for (const link of entry.links) {
      const proj = link.projectPath;
      if (!projectMap.has(proj)) {
        projectMap.set(proj, []);
      }
      projectMap.get(proj)!.push(link.destination);
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

    // Get destinations linked in this project
    const destinationsInProject = projectMap.get(projectPath) || [];

    if (!destination) {
      if (destinationsInProject.length === 1) {
        destination = destinationsInProject[0];
      } else {
        const destLabels: Record<string, string> = {
          claude: '🤖 Claude Code',
          others: '🔧 Others',
          all: '🌐 All',
        };
        const choices = [
          ...destinationsInProject.map(d => ({ name: destLabels[d] || d, value: d })),
          { name: destLabels.all, value: 'all' },
        ];
        const result = await customSelect({
          message: 'Select destination to unlink:',
          choices,
        });
        if (result === null) return; // ESC
        destination = result as LinkDestination;
      }
    }
  }

  try {
    await unlinkSkill(skillName, destination, projectPath!);
    log.success(`Unlinked ${chalk.bold(skillName)} from ${chalk.cyan(destination)}`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}
