import chalk from 'chalk';
import { interactiveMenu } from '../prompts/interactive-menu.js';
import { linkCommand } from './link.js';
import { unlinkCommand } from './unlink.js';

interface ListOptions {
  source?: string;
  agent?: string;
}

export async function listCommand(_options: ListOptions): Promise<void> {
  console.log('');

  const result = await interactiveMenu({ message: 'Select a skill:' });

  if (result.startsWith('link:')) {
    const skillName = result.slice(5);
    await linkCommand(skillName, {});
  } else if (result.startsWith('unlink:')) {
    const skillName = result.slice(7);
    await unlinkCommand(skillName, {});
  }
}
