import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getConfigDir, getAgentsDir, getRegistryPath, getSkillSourceDirs } from '../../utils/paths.js';
import { log } from '../../utils/logger.js';

const DEFAULT_AGENTS = [
  {
    name: 'claude',
    type: 'claude-code',
    paths: { project: '.claude', global: '~/.claude', skills: 'skills' },
    load_order: ['project', 'global'],
  },
  {
    name: 'cursor',
    type: 'cursor',
    paths: { project: '.cursor', global: '~/.cursor', skills: 'skills' },
    load_order: ['project', 'global'],
  },
];

export async function initCommand(): Promise<void> {
  console.log(chalk.bold('\n⚒  SkillForge Init\n'));

  // 1. Create ~/.skillforge/ structure
  const configDir = getConfigDir();
  const agentsDir = getAgentsDir();
  const registryPath = getRegistryPath();

  await fs.ensureDir(configDir);
  await fs.ensureDir(agentsDir);
  log.success(`Created ${configDir}`);

  // 2. Write default agent configs
  for (const agent of DEFAULT_AGENTS) {
    const filePath = path.join(agentsDir, `${agent.name}.yaml`);
    if (!await fs.pathExists(filePath)) {
      const content = yaml.dump(agent, { lineWidth: 120 });
      await fs.writeFile(filePath, content, 'utf-8');
      log.success(`Created agent config: ${agent.name}.yaml`);
    } else {
      log.muted(`  Skipped (exists): ${agent.name}.yaml`);
    }
  }

  // 3. Initialize empty registry
  if (!await fs.pathExists(registryPath)) {
    await fs.writeFile(registryPath, JSON.stringify({ version: 1, skills: {} }, null, 2), 'utf-8');
    log.success('Initialized empty registry.json');
  } else {
    log.muted('  Skipped (exists): registry.json');
  }

  // 4. Ensure skills directories exist
  const dirs = getSkillSourceDirs();
  for (const [name, dirPath] of Object.entries(dirs)) {
    await fs.ensureDir(dirPath);
    log.success(`Ensured skills directory: ${name}/`);
  }

  console.log('');
  log.success('SkillForge initialized successfully!');
  console.log('');
}
