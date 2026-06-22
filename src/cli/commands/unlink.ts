import chalk from 'chalk';
import { findSkillsByTag } from '../../core/skill/discovery.js';
import { unlinkSkill } from '../../core/link/manager.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { selectPrompt } from '../prompts/select.js';
import { selectProject, selectDestination } from './link.js';
import { log } from '../../utils/logger.js';
import type { LinkDestination } from '../../types/destination.js';

const customSelect = selectPrompt<string>();

interface UnlinkOptions {
  destination?: LinkDestination;
  project?: string;
  tag?: string;
}

/** Unlink a single skill interactively. */
export async function unlinkCommand(skillName: string, options: UnlinkOptions): Promise<void> {
  // If --tag is provided, delegate to batchUnlink
  if (options.tag) {
    await batchUnlinkCommand(options.tag, options);
    return;
  }

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
        if (result === null) return;
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
        if (result === null) return;
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

/** Batch unlink all skills with a given tag. */
export async function batchUnlinkCommand(tag: string, options: UnlinkOptions): Promise<void> {
  const items = await findSkillsByTag(tag);

  if (items.length === 0) {
    log.error(`No skills found with tag "${tag}".`);
    return;
  }

  // Filter to only skills that have active links
  const registry = await loadRegistry();
  const linkedItems = items.filter(item => {
    const entry = registry.skills[item.skill.metadata.name];
    return entry && entry.links.length > 0;
  });

  if (linkedItems.length === 0) {
    log.error(`No skills with tag "${tag}" have active links.`);
    return;
  }

  console.log(chalk.bold(`\n⚒  Unlinking skills with tag: ${tag}\n`));

  // Show which skills will be unlinked
  for (const item of linkedItems) {
    console.log(`  ${chalk.gray('●')} ${item.skill.metadata.name}`);
  }
  console.log('');

  let destination = options.destination;
  let projectPath = options.project;

  if (!projectPath) {
    projectPath = await selectProject('Unlink') ?? undefined;
    if (!projectPath) return;
  }

  if (!destination) {
    destination = await selectDestination() ?? undefined;
    if (!destination) return;
  }

  // Batch unlink
  const success: string[] = [];
  const failed: string[] = [];

  for (const item of linkedItems) {
    try {
      await unlinkSkill(item.skill.metadata.name, destination, projectPath);
      success.push(item.skill.metadata.name);
      log.success(`Unlinked ${chalk.bold(item.skill.metadata.name)} from ${chalk.cyan(destination)}`);
    } catch (err) {
      failed.push(item.skill.metadata.name);
      log.error(`Failed to unlink ${item.skill.metadata.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('');
  if (success.length > 0) {
    console.log(chalk.green(`  ${success.length} skill${success.length !== 1 ? 's' : ''} unlinked from ${projectPath}`));
  }
  if (failed.length > 0) {
    console.log(chalk.red(`  ${failed.length} skill${failed.length !== 1 ? 's' : ''} failed`));
  }
}
