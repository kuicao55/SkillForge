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
import { cleanCommand } from './commands/clean.js';
import { infoCommand } from './commands/info.js';
import { configCommand } from './commands/config.js';
import { helpCommand } from './commands/help.js';

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
  .option('-s, --source <type>', 'Filter by source: personal, community, curated, experimental')
  .option('-t, --tag [value]', 'Filter by tag, or show tag browser if no value given')
  .action(listCommand);

function collectSkill(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

program
  .command('add <source>')
  .description('Install skills from a Git URL or the community registry')
  .option(
    '-s, --skill <name>',
    'Install only this skill (repeatable, or comma-separated)',
    collectSkill,
  )
  .addHelpText('after', `
Examples:
  $ skill add lovstudio/md2pdf
  $ skill add https://github.com/twostraws/swiftui-agent-skill --skill swiftui-pro
  $ skill add git@github.com:owner/repo.git --skill foo,bar`)
  .action(addCommand);

program
  .command('remove <name>')
  .description('Remove a community skill')
  .action(removeCommand);

program
  .command('link [skill]')
  .description('Link a skill to a project')
  .option('-t, --tag <value>', 'Link all skills with this tag (skill name not required)')
  .option('-d, --destination <type>', 'Destination: claude, others, all')
  .option('-p, --project <path>', 'Project directory path')
  .action(linkCommand);

program
  .command('unlink <skill>')
  .description('Unlink a skill from a project')
  .option('-d, --destination <type>', 'Destination: claude, others, all')
  .option('-p, --project <path>', 'Project directory path')
  .action(unlinkCommand);

program
  .command('enable <skill>')
  .description('Enable a skill globally')
  .requiredOption('-d, --destination <type>', 'Destination: claude, others, all')
  .action((skill, opts) => enableCommand(skill, opts.destination));

program
  .command('disable <skill>')
  .description('Disable a globally enabled skill')
  .requiredOption('-d, --destination <type>', 'Destination: claude, others, all')
  .action((skill, opts) => disableCommand(skill, opts.destination));

program
  .command('doctor')
  .description('Health check — verify links and detect issues')
  .action(doctorCommand);

program
  .command('clean')
  .description('Clean up broken links, orphan entries, and cache')
  .action(cleanCommand);

program
  .command('info <name>')
  .description('Show detailed information about a skill')
  .action(infoCommand);

program
  .command('config [action] [value]')
  .description('Show or set configuration (show, set-root, reset-root)')
  .action(configCommand);

program
  .command('help')
  .description('Show all available commands')
  .action(helpCommand);

program.parse();
