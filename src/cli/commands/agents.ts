import chalk from 'chalk';
import { loadAgents } from '../../core/agent/manager.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';

export async function agentsCommand(): Promise<void> {
  const agents = await loadAgents();

  if (agents.length === 0) {
    log.warn('No agents configured. Run "skillforge init" to set up default agents.');
    return;
  }

  const registry = await loadRegistry();

  console.log(chalk.bold('\n  Agents\n'));

  for (const agent of agents) {
    // Count skills linked to this agent
    const linkedSkills = Object.values(registry.skills).filter(entry =>
      entry.links.some(l => l.agent === agent.config.name),
    );

    console.log(`  ${chalk.cyan('●')} ${chalk.bold(agent.config.name)} ${chalk.gray(`(${agent.config.type})`)}`);
    console.log(`    Project: ${agent.config.paths.project}/${agent.config.paths.skills}`);
    console.log(`    Global:  ${agent.config.paths.global}/${agent.config.paths.skills}`);
    console.log(`    Skills:  ${linkedSkills.length} linked`);
  }

  console.log('');
}
