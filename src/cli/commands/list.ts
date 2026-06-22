import chalk from 'chalk';
import { interactiveMenu } from '../prompts/interactive-menu.js';
import { tagBrowser } from '../prompts/tag-browser.js';
import { skillInfoPrompt } from '../prompts/skill-info.js';
import { findSkill, findSkillsByTag } from '../../core/skill/discovery.js';
import { linkCommand, batchLinkCommand, selectProject, selectDestination } from './link.js';
import { unlinkCommand, batchUnlinkCommand } from './unlink.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';
import { selectPrompt } from '../prompts/select.js';
import type { SkillSource } from '../../types/skill.js';

const customSelect = selectPrompt<string>();

interface ListOptions {
  source?: string;
  tag?: string | boolean;
}

/** Normal flow: browse all skills (existing behavior). */
async function normalFlow(): Promise<void> {
  let running = true;
  while (running) {
    const listResult = await interactiveMenu({ message: 'Select a skill:' });

    if (!listResult.startsWith('info:')) {
      running = false;
      break;
    }

    const skillName = listResult.slice(5);
    const skill = await findSkill(skillName);
    if (!skill) {
      log.error(`Skill "${skillName}" not found.`);
      continue;
    }

    const source: SkillSource = skill.metadata.source || 'personal';

    let inInfo = true;
    while (inInfo) {
      const action = await skillInfoPrompt({ skill, source, showBack: true });

      if (action === 'back') {
        inInfo = false;
      } else if (action === 'link') {
        await linkCommand(skillName, {});
      } else if (action === 'unlink') {
        await unlinkCommand(skillName, {});
      }
    }
  }
}

/** Tag flow: browse by tag, with batch link/unlink support. */
async function tagFlow(initialTag?: string): Promise<void> {
  let tag = initialTag;

  // Step 1: Select tag (skip if already provided)
  if (!tag) {
    const selected = await tagBrowser({ message: 'Select a tag:' });
    tag = selected;
  }

  if (!tag) return;

  // Step 2: Get skills with this tag
  const items = await findSkillsByTag(tag);
  if (items.length === 0) {
    log.error(`No skills found with tag "${tag}".`);
    return;
  }

  // Step 3: Load registry to show linked projects
  const registry = await loadRegistry();

  const BATCH_LINK = `🔗 Link all ${items.length} skills to project...`;
  const BATCH_UNLINK = `🔓 Unlink all ${items.length} skills from project...`;
  const BACK = '← Back';

  const choices = [
    { name: BATCH_LINK, value: '__link_all__' },
    { name: BATCH_UNLINK, value: '__unlink_all__' },
    ...items.map(item => {
      const entry = registry.skills[item.skill.metadata.name];
      let linkedInfo = '';
      if (entry && entry.links.length > 0) {
        const projects = new Set<string>();
        for (const link of entry.links) {
          const proj = link.projectPath === '__global__' ? 'global' : link.projectPath;
          projects.add(proj);
        }
        linkedInfo = ` ${chalk.green('→')} ${chalk.gray(Array.from(projects).join(', '))}`;
      }
      return {
        name: `${item.skill.metadata.name} ${chalk.gray(`(${item.source})`)}${linkedInfo}`,
        value: item.skill.metadata.name,
      };
    }),
    { name: BACK, value: '__back__' },
  ];

  let running = true;
  while (running) {
    console.log('');
    console.log(chalk.bold(`  Skills tagged "${tag}":`));
    console.log('');

    const result = await customSelect({
      message: `Select action (${items.length} skills):`,
      choices,
    });

    if (result === null || result === '__back__') {
      running = false;
    } else if (result === '__link_all__') {
      const projectPath = await selectProject();
      if (!projectPath) continue;
      const destination = await selectDestination();
      if (!destination) continue;
      await batchLinkCommand(tag, { project: projectPath, destination });
    } else if (result === '__unlink_all__') {
      const projectPath = await selectProject();
      if (!projectPath) continue;
      const destination = await selectDestination();
      if (!destination) continue;
      await batchUnlinkCommand(tag, { project: projectPath, destination });
    } else {
      // Individual skill view
      const skill = await findSkill(result);
      if (!skill) {
        log.error(`Skill "${result}" not found.`);
        continue;
      }

      const source: SkillSource = skill.metadata.source || 'personal';

      let inInfo = true;
      while (inInfo) {
        const action = await skillInfoPrompt({ skill, source, showBack: true });

        if (action === 'back') {
          inInfo = false;
        } else if (action === 'link') {
          await linkCommand(result, {});
        } else if (action === 'unlink') {
          await unlinkCommand(result, {});
        }
      }
    }
  }
}

export async function listCommand(options: ListOptions): Promise<void> {
  console.log('');

  if (options.tag === true) {
    // --tag without value: show tag browser
    await tagFlow();
  } else if (typeof options.tag === 'string') {
    // --tag <value>: show filtered list for that tag
    await tagFlow(options.tag);
  } else {
    // Normal flow: show all skills
    await normalFlow();
  }
}
