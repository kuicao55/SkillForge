import fs from 'fs-extra';
import { getConfigDir, getRegistryPath, getSkillSourceDirs } from '../utils/paths.js';

/**
 * Ensure SkillForge is initialized. Creates config dir,
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
