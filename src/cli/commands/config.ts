import chalk from 'chalk';
import { loadConfig, saveConfig, getProjectsRoot } from '../../core/config/index.js';
import { log } from '../../utils/logger.js';

export async function configCommand(action: string, value?: string): Promise<void> {
  if (action === 'show') {
    const config = await loadConfig();
    const root = await getProjectsRoot();
    console.log(chalk.bold('\n  Config\n'));
    console.log(`  ${chalk.gray('projectsRoot:')} ${root}`);
    if (config.projectsRoot) {
      console.log(`  ${chalk.gray('(custom)')}`);
    } else {
      console.log(`  ${chalk.gray('(default: ~/Developer)')}`);
    }
    console.log('');
    return;
  }

  if (action === 'set-root') {
    if (!value) {
      log.error('Please provide a path: skill config set-root <path>');
      return;
    }
    const config = await loadConfig();
    config.projectsRoot = value;
    await saveConfig(config);
    log.success(`Projects root set to: ${value}`);
    return;
  }

  if (action === 'reset-root') {
    const config = await loadConfig();
    delete config.projectsRoot;
    await saveConfig(config);
    log.success('Projects root reset to default (~/Developer)');
    return;
  }

  console.log(chalk.bold('\n  Config commands:\n'));
  console.log(`  ${chalk.cyan('skill config show')}        Show current config`);
  console.log(`  ${chalk.cyan('skill config set-root <p>')} Set projects root directory`);
  console.log(`  ${chalk.cyan('skill config reset-root')}   Reset to default (~/Developer)`);
  console.log('');
}
