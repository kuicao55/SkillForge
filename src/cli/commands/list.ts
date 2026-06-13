import { interactiveMenu } from '../prompts/interactive-menu.js';
import { skillInfoPrompt } from '../prompts/skill-info.js';
import { findSkill } from '../../core/skill/discovery.js';
import { linkCommand } from './link.js';
import { unlinkCommand } from './unlink.js';
import { log } from '../../utils/logger.js';
import type { SkillSource } from '../../types/skill.js';

interface ListOptions {
  source?: string;
  agent?: string;
}

export async function listCommand(_options: ListOptions): Promise<void> {
  console.log('');

  // Outer loop: list ↔ info
  let running = true;
  while (running) {
    // Step 1: Interactive skill list
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

    // Inner loop: info → action → info
    let inInfo = true;
    while (inInfo) {
      const action = await skillInfoPrompt({ skill, source, showBack: true });

      if (action === 'back') {
        inInfo = false; // back to list
      } else if (action === 'link') {
        await linkCommand(skillName, {});
        // stay in info loop
      } else if (action === 'unlink') {
        await unlinkCommand(skillName, {});
        // stay in info loop
      }
    }
  }
}
