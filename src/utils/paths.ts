import path from 'node:path';
import os from 'node:os';

/** Expand ~ to the user's home directory */
export function expandHome(p: string): string {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

/** Default skills root directory */
export function getSkillsRoot(): string {
  return expandHome('~/Developer/Skills');
}

/** SkillForge config directory */
export function getConfigDir(): string {
  return expandHome('~/.skillforge');
}

/** Registry file path */
export function getRegistryPath(): string {
  return path.join(getConfigDir(), 'registry.json');
}

/** Source directories for skills */
export function getSkillSourceDirs() {
  const root = getSkillsRoot();
  return {
    personal: path.join(root, 'Personal'),
    community: path.join(root, 'Community'),
    curated: path.join(root, 'Curated'),
    experimental: path.join(root, 'Experimental'),
  };
}
