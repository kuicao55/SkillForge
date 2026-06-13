import { findSkill } from '../../core/skill/discovery.js';
import { skillInfoPrompt } from '../prompts/skill-info.js';
import { linkCommand } from './link.js';
import { unlinkCommand } from './unlink.js';
import { log } from '../../utils/logger.js';
import type { SkillSource } from '../../types/skill.js';

export async function infoCommand(name: string): Promise<void> {
  const skill = await findSkill(name);
  if (!skill) {
    log.error(`Skill "${name}" not found.`);
    return;
  }

  const source: SkillSource = skill.metadata.source || 'personal';

  console.log('');

  // Show info with actions (no "back" in standalone mode)
  const action = await skillInfoPrompt({ skill, source, showBack: false });

  if (action === 'link') {
    await linkCommand(name, {});
  } else if (action === 'unlink') {
    await unlinkCommand(name, {});
  }
}
