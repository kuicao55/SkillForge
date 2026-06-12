import chalk from 'chalk';
import { discoverSkills } from '../../core/skill/discovery.js';
import { loadRegistry } from '../../core/registry/manager.js';
import type { Skill, SkillSource } from '../../types/skill.js';

interface ListOptions {
  source?: string;
  agent?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const categories = await discoverSkills();
  const registry = await loadRegistry();

  const allSkills: Array<{ skill: Skill; source: SkillSource }> = [];

  for (const skill of categories.personal) {
    allSkills.push({ skill, source: 'personal' });
  }
  for (const skill of categories.community) {
    allSkills.push({ skill, source: 'community' });
  }
  for (const skill of categories.experimental) {
    allSkills.push({ skill, source: 'experimental' });
  }

  // Filter by source
  let filtered = allSkills;
  if (options.source) {
    filtered = filtered.filter(s => s.source === options.source);
  }

  // Filter by agent (show only skills linked to this agent)
  if (options.agent) {
    filtered = filtered.filter(s => {
      const entry = registry.skills[s.skill.metadata.name];
      return entry?.links.some(l => l.agent === options.agent);
    });
  }

  if (filtered.length === 0) {
    console.log(chalk.yellow('\n  No skills found.\n'));
    return;
  }

  console.log(chalk.bold('\n  Skills\n'));

  // Source colors
  const sourceColors: Record<string, typeof chalk> = {
    personal: chalk.blue,
    community: chalk.green,
    experimental: chalk.yellow,
  };

  for (const { skill, source } of filtered) {
    const color = sourceColors[source] || chalk.white;
    const tags = skill.metadata.tags?.length ? chalk.gray(` [${skill.metadata.tags.join(', ')}]`) : '';
    const version = skill.metadata.version ? chalk.gray(` v${skill.metadata.version}`) : '';
    const links = registry.skills[skill.metadata.name]?.links || [];
    const linkedAgents = links.length ? chalk.cyan(` → ${links.map(l => l.agent).join(', ')}`) : '';

    console.log(
      `  ${color('●')} ${chalk.bold(skill.metadata.name)}${version}${tags}${linkedAgents}`,
    );
    if (skill.metadata.description) {
      console.log(`    ${chalk.gray(skill.metadata.description)}`);
    }
  }

  console.log('');
}
