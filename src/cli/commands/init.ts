import fs from 'fs-extra';
import chalk from 'chalk';
import { getConfigDir, getRegistryPath, getSkillSourceDirs } from '../../utils/paths.js';
import { log } from '../../utils/logger.js';

export async function initCommand(): Promise<void> {
  console.log(chalk.bold('\n⚒  SkillForge Init\n'));

  // 1. Create ~/.skillforge/ structure
  const configDir = getConfigDir();
  const registryPath = getRegistryPath();

  await fs.ensureDir(configDir);
  log.success(`Created ${configDir}`);

  // 2. Initialize empty registry
  if (!await fs.pathExists(registryPath)) {
    await fs.writeFile(registryPath, JSON.stringify({ version: 1, skills: {} }, null, 2), 'utf-8');
    log.success('Initialized empty registry.json');
  } else {
    log.muted('  Skipped (exists): registry.json');
  }

  // 3. Ensure skills directories exist
  const dirs = getSkillSourceDirs();
  for (const [name, dirPath] of Object.entries(dirs)) {
    await fs.ensureDir(dirPath);
    log.success(`Ensured skills directory: ${name}/`);
  }

  console.log('');
  log.success('SkillForge initialized successfully!');
  console.log('');
}
