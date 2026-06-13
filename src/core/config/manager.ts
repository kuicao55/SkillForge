import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { getConfigDir } from '../../utils/paths.js';

interface SkillForgeConfig {
  projectsRoot?: string;
}

const CONFIG_FILE = 'config.json';

function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILE);
}

export async function loadConfig(): Promise<SkillForgeConfig> {
  const configPath = getConfigPath();
  if (!await fs.pathExists(configPath)) {
    return {};
  }
  try {
    return JSON.parse(await fs.readFile(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export async function saveConfig(config: SkillForgeConfig): Promise<void> {
  const configPath = getConfigPath();
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getProjectsRoot(): Promise<string> {
  const config = await loadConfig();
  return config.projectsRoot || path.join(os.homedir(), 'Developer');
}
