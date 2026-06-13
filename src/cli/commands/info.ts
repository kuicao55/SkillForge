import chalk from 'chalk';
import { findSkill } from '../../core/skill/discovery.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { loadAgents } from '../../core/agent/manager.js';
import type { SkillSource } from '../../types/skill.js';
import { log } from '../../utils/logger.js';

export async function infoCommand(name: string): Promise<void> {
  const skill = await findSkill(name);
  if (!skill) {
    log.error(`Skill "${name}" not found.`);
    return;
  }

  const registry = await loadRegistry();
  const agents = await loadAgents();
  const entry = registry.skills[name];
  const meta = skill.metadata;

  // Source label
  const source = meta.source as SkillSource;
  let sourceLabel: string;
  if (source === 'community' && meta.package) {
    sourceLabel = meta.package;
  } else if (source === 'experimental') {
    sourceLabel = 'experimental';
  } else {
    sourceLabel = 'local';
  }

  // Build agent icon map
  const agentIconMap = new Map<string, string>();
  for (const agent of agents) {
    agentIconMap.set(agent.config.name, agent.config.icon || '');
  }

  console.log(chalk.bold(`\n  ${meta.name}\n`));

  if (meta.description) {
    console.log(`  ${meta.description}\n`);
  }

  console.log(`  ${chalk.gray('Source:')}   ${sourceLabel}`);
  console.log(`  ${chalk.gray('Path:')}     ${skill.path}`);

  if (meta.version) {
    console.log(`  ${chalk.gray('Version:')}  ${meta.version}`);
  }
  if (meta.author) {
    console.log(`  ${chalk.gray('Author:')}   ${meta.author}`);
  }
  if (meta.tags && meta.tags.length > 0) {
    console.log(`  ${chalk.gray('Tags:')}     ${meta.tags.join(', ')}`);
  }

  // Linked projects
  if (entry && entry.links.length > 0) {
    console.log(`\n  ${chalk.gray('Linked:')}`);
    for (const link of entry.links) {
      const icon = agentIconMap.get(link.agent) || '';
      const iconStr = icon ? `${icon} ` : '';
      const projectLabel = link.projectPath === '__global__' ? 'global' : link.projectPath;
      console.log(`    → ${projectLabel} ${chalk.cyan(`(${iconStr}${link.agent})`)}`);
    }
  }

  console.log('');
}
