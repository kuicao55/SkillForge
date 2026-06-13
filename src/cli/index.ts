import { Command } from 'commander';
import { ensureInit } from '../core/auto-init.js';
import { initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { linkCommand } from './commands/link.js';
import { unlinkCommand } from './commands/unlink.js';
import { enableCommand, disableCommand } from './commands/enable.js';
import { doctorCommand } from './commands/doctor.js';
import { agentsCommand } from './commands/agents.js';
import { infoCommand } from './commands/info.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('skill')
  .description('AI Skill Management System — manage, compose, and link skills across AI agents')
  .version('0.1.0');

// Auto-initialize before any command
program.hook('preAction', async () => {
  await ensureInit();
});

program
  .command('init')
  .description('Re-initialize SkillForge configuration (safe to run multiple times)')
  .action(initCommand);

program
  .command('list')
  .description('List all discovered skills')
  .option('-s, --source <type>', 'Filter by source: personal, community, experimental')
  .option('-a, --agent <name>', 'Filter by linked agent')
  .action(listCommand);

program
  .command('add <name>')
  .description('Install a skill from the community registry')
  .action(addCommand);

program
  .command('remove <name>')
  .description('Remove a community skill')
  .action(removeCommand);

program
  .command('link <skill>')
  .description('Link a skill to an agent project')
  .option('-a, --agent <name>', 'Agent name (e.g. claude, cursor)')
  .option('-p, --project <path>', 'Project directory path')
  .action(linkCommand);

program
  .command('unlink <skill>')
  .description('Unlink a skill from an agent project')
  .option('-a, --agent <name>', 'Agent name')
  .option('-p, --project <path>', 'Project directory path')
  .action(unlinkCommand);

program
  .command('enable <skill>')
  .description('Enable a skill globally for an agent')
  .requiredOption('-a, --agent <name>', 'Agent name')
  .action((skill, opts) => enableCommand(skill, opts.agent));

program
  .command('disable <skill>')
  .description('Disable a globally enabled skill')
  .requiredOption('-a, --agent <name>', 'Agent name')
  .action((skill, opts) => disableCommand(skill, opts.agent));

program
  .command('doctor')
  .description('Health check — verify links and detect issues')
  .action(doctorCommand);

program
  .command('agents')
  .description('List configured agents')
  .action(agentsCommand);

program
  .command('info <name>')
  .description('Show detailed information about a skill')
  .action(infoCommand);

program
  .command('config [action] [value]')
  .description('Show or set configuration (show, set-root, reset-root)')
  .action(configCommand);

program.parse();
