import chalk from 'chalk';
import { interactiveMenu } from '../prompts/interactive-menu.js';
import { tagBrowser } from '../prompts/tag-browser.js';
import { skillInfoPrompt } from '../prompts/skill-info.js';
import { findSkill, findSkillsByTag } from '../../core/skill/discovery.js';
import { linkCommand, batchLinkCommand } from './link.js';
import { unlinkCommand } from './unlink.js';
import { selectProject, selectDestination } from './link.js';
import { log } from '../../utils/logger.js';
import type { SkillSource } from '../../types/skill.js';

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

/** Tag flow: browse by tag, with batch link support. */
async function tagFlow(initialTag?: string): Promise<void> {
  let tag = initialTag;

  // Step 1: Select tag (skip if already provided)
  if (!tag) {
    const selected = await tagBrowser({ message: 'Select a tag:' });
    tag = selected;
  }

  if (!tag) return;

  // Step 2: Show filtered skill list with batch actions
  let running = true;
  while (running) {
    const listResult = await interactiveMenu({
      message: `Skills tagged "${tag}":`,
      filterTag: tag,
      showBatchActions: true,
    });

    if (listResult.startsWith('link-all:')) {
      // Batch link all skills with this tag
      const projectPath = await selectProject();
      if (!projectPath) continue;
      const destination = await selectDestination();
      if (!destination) continue;
      await batchLinkCommand(tag, { project: projectPath, destination });
    } else if (listResult.startsWith('info:')) {
      // Individual skill view
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
    } else {
      running = false;
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
