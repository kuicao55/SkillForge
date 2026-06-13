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

  // Step 1: Interactive skill list
  const listResult = await interactiveMenu({ message: 'Select a skill:' });

  if (!listResult.startsWith('info:')) return;

  const skillName = listResult.slice(5);
  const skill = await findSkill(skillName);
  if (!skill) {
    log.error(`Skill "${skillName}" not found.`);
    return;
  }

  // Infer source
  const source: SkillSource = skill.metadata.source || 'personal';

  // Step 2: Show skill info with actions (loop until user goes back)
  let running = true;
  while (running) {
    const action = await skillInfoPrompt({ skill, source, showBack: true });

    if (action === 'back') {
      running = false;
    } else if (action === 'link') {
      await linkCommand(skillName, {});
      running = false;
    } else if (action === 'unlink') {
      await unlinkCommand(skillName, {});
      running = false;
    }
  }
}
