import chalk from 'chalk';

export async function helpCommand(): Promise<void> {
  console.log(chalk.bold('\n  Skill — AI Skill Management System\n'));

  const commands = [
    { cmd: 'skill list', desc: 'Browse skills (interactive, ↑↓ select, ↵ info)' },
    { cmd: 'skill info <name>', desc: 'View skill details + actions (link/unlink)' },
    { cmd: 'skill add <name>', desc: 'Install a third-party skill (e.g. skill add lovstudio/md2pdf)' },
    { cmd: 'skill remove <name>', desc: 'Remove a community skill' },
    { cmd: 'skill link <skill>', desc: 'Link a skill to a project (interactive)' },
    { cmd: 'skill link <skill> -a <agent> -p <path>', desc: 'Link a skill (direct)' },
    { cmd: 'skill unlink <skill>', desc: 'Unlink a skill (interactive)' },
    { cmd: 'skill unlink <skill> -a <agent> -p <path>', desc: 'Unlink a skill (direct)' },
    { cmd: 'skill enable <skill> -a <agent>', desc: 'Enable a skill globally for an agent' },
    { cmd: 'skill disable <skill> -a <agent>', desc: 'Disable a globally enabled skill' },
    { cmd: 'skill agents', desc: 'List configured agents with icons' },
    { cmd: 'skill doctor', desc: 'Health check — verify links' },
    { cmd: 'skill config show', desc: 'Show current configuration' },
    { cmd: 'skill config set-root <path>', desc: 'Set projects root directory' },
    { cmd: 'skill config reset-root', desc: 'Reset projects root to default (~/Developer)' },
    { cmd: 'skill init', desc: 'Re-initialize configuration' },
    { cmd: 'skill help', desc: 'Show this help message' },
  ];

  const maxLen = Math.max(...commands.map(c => c.cmd.length));

  for (const { cmd, desc } of commands) {
    console.log(`  ${chalk.cyan(cmd.padEnd(maxLen + 2))}${chalk.gray(desc)}`);
  }

  console.log(chalk.gray(`\n  ↑↓ navigate  ↵ select  esc back  ctrl+c exit\n`));
}
