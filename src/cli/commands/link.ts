import chalk from 'chalk';
import { findSkill, findSkillsByTag, type SkillItem } from '../../core/skill/discovery.js';
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
  tag?: string;
}

/** Interactive project selection. Returns the selected path or null if cancelled. */
export async function selectProject(verb = 'Link'): Promise<string | null> {
  const rootDir = await getProjectsRoot();

  let confirmed = false;
  while (!confirmed) {
    const selected = await directoryBrowser({
      message: 'Select project directory:',
      rootDir,
    });

    const result = await customConfirm({
      message: `${verb} to/from this project?\n  ${chalk.gray(selected)}`,
    });

    if (result === null) return null;
    confirmed = result;

    if (confirmed) {
      return selected;
    }
  }
  return null;
}

/** Interactive destination selection. Returns the selected destination or null if cancelled. */
export async function selectDestination(): Promise<LinkDestination | null> {
  const result = await customSelect({
    message: 'Select destination:',
    choices: DESTINATION_CHOICES,
  });

  if (result === null) return null;
  return result as LinkDestination;
}

/** Link a single skill interactively. */
export async function linkCommand(skillName: string, options: LinkOptions): Promise<void> {
  // If --tag is provided, delegate to batchLink
  if (options.tag) {
    await batchLinkCommand(options.tag, options);
    return;
  }

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
  if (!projectPath) {
    projectPath = await selectProject() ?? undefined;
    if (!projectPath) return;
  }

  if (!destination) {
    destination = await selectDestination() ?? undefined;
    if (!destination) return;
  }

  // Create link
  try {
    const symlinkPaths = await linkSkill(skillName, skill.path, destination, projectPath);
    for (const p of symlinkPaths) {
      log.success(`Linked ${chalk.bold(skillName)} → ${chalk.cyan(destination)} (${p})`);
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

/** Batch link all skills with a given tag. */
export async function batchLinkCommand(tag: string, options: LinkOptions): Promise<void> {
  const items = await findSkillsByTag(tag);

  if (items.length === 0) {
    log.error(`No skills found with tag "${tag}".`);
    return;
  }

  console.log(chalk.bold(`\n⚒  Linking skills with tag: ${tag}\n`));

  // Show which skills will be linked
  for (const item of items) {
    console.log(`  ${chalk.gray('●')} ${item.skill.metadata.name}`);
  }
  console.log('');

  let destination = options.destination;
  let projectPath = options.project;

  if (!projectPath) {
    projectPath = await selectProject() ?? undefined;
    if (!projectPath) return;
  }

  if (!destination) {
    destination = await selectDestination() ?? undefined;
    if (!destination) return;
  }

  // Batch link
  const success: string[] = [];
  const failed: string[] = [];

  for (const item of items) {
    try {
      await linkSkill(item.skill.metadata.name, item.skill.path, destination, projectPath);
      success.push(item.skill.metadata.name);
      log.success(`Linked ${chalk.bold(item.skill.metadata.name)} → ${chalk.cyan(destination)}`);
    } catch (err) {
      failed.push(item.skill.metadata.name);
      log.error(`Failed to link ${item.skill.metadata.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('');
  if (success.length > 0) {
    console.log(chalk.green(`  ${success.length} skill${success.length !== 1 ? 's' : ''} linked to ${projectPath}`));
  }
  if (failed.length > 0) {
    console.log(chalk.red(`  ${failed.length} skill${failed.length !== 1 ? 's' : ''} failed`));
  }
}
