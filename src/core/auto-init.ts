import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'js-yaml';
import { getConfigDir, getAgentsDir, getRegistryPath, getSkillSourceDirs } from '../utils/paths.js';

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

/**
 * Ensure SkillForge is initialized. Creates config dirs, default agents,
 * empty registry, and skills directories if they don't exist.
 * Runs silently — only creates what's missing.
 */
export async function ensureInit(): Promise<void> {
  const configDir = getConfigDir();

  // Already initialized — skip
  if (await fs.pathExists(configDir)) {
    // Still ensure skills dirs exist (they might have been deleted)
    const dirs = getSkillSourceDirs();
    for (const dir of Object.values(dirs)) {
      await fs.ensureDir(dir);
    }
    return;
  }

  // Create ~/.skillforge/
  await fs.ensureDir(configDir);
  await fs.ensureDir(getAgentsDir());

  // Write default agent configs
  for (const agent of DEFAULT_AGENTS) {
    const filePath = path.join(getAgentsDir(), `${agent.name}.yaml`);
    const content = yaml.dump(agent, { lineWidth: 120 });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  // Initialize empty registry
  await fs.writeFile(
    getRegistryPath(),
    JSON.stringify({ version: 1, skills: {} }, null, 2),
    'utf-8',
  );

  // Ensure skills directories
  const dirs = getSkillSourceDirs();
  for (const dir of Object.values(dirs)) {
    await fs.ensureDir(dir);
  }
}
