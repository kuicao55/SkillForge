import fs from 'fs-extra';
import { type Registry, type RegistryEntry, type LinkRecord, RegistrySchema } from '../../types/registry.js';
import { getRegistryPath } from '../../utils/paths.js';

const EMPTY_REGISTRY: Registry = { version: 1, skills: {} };

/**
 * Load the registry from disk, creating it if it doesn't exist.
 */
export async function loadRegistry(): Promise<Registry> {
  const registryPath = getRegistryPath();

  if (!await fs.pathExists(registryPath)) {
    await saveRegistry(EMPTY_REGISTRY);
    return EMPTY_REGISTRY;
  }

  try {
    const raw = await fs.readFile(registryPath, 'utf-8');
    const data = JSON.parse(raw);
    const parsed = RegistrySchema.safeParse(data);
    if (!parsed.success) {
      return EMPTY_REGISTRY;
    }
    return parsed.data;
  } catch {
    return EMPTY_REGISTRY;
  }
}

/**
 * Save the registry to disk atomically.
 */
export async function saveRegistry(registry: Registry): Promise<void> {
  const registryPath = getRegistryPath();
  await fs.ensureDir(await import('node:path').then(p => p.default.dirname(registryPath)));

  const tmpPath = registryPath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(registry, null, 2), 'utf-8');
  await fs.rename(tmpPath, registryPath);
}

/**
 * Register a new skill in the registry.
 */
export async function registerSkill(entry: RegistryEntry): Promise<void> {
  const registry = await loadRegistry();
  registry.skills[entry.name] = entry;
  await saveRegistry(registry);
}

/**
 * Remove a skill from the registry.
 */
export async function unregisterSkill(name: string): Promise<void> {
  const registry = await loadRegistry();
  delete registry.skills[name];
  await saveRegistry(registry);
}

/**
 * Add a link record to a skill's registry entry.
 */
export async function addLink(name: string, link: LinkRecord): Promise<void> {
  const registry = await loadRegistry();
  const entry = registry.skills[name];
  if (!entry) return;

  // Avoid duplicate links
  const exists = entry.links.some(
    l => l.agent === link.agent && l.projectPath === link.projectPath && l.symlinkPath === link.symlinkPath,
  );
  if (!exists) {
    entry.links.push(link);
    await saveRegistry(registry);
  }
}

/**
 * Remove a link record from a skill's registry entry.
 */
export async function removeLink(
  name: string,
  agent: string,
  projectPath: string,
  symlinkPath: string,
): Promise<void> {
  const registry = await loadRegistry();
  const entry = registry.skills[name];
  if (!entry) return;

  entry.links = entry.links.filter(
    l => !(l.agent === agent && l.projectPath === projectPath && l.symlinkPath === symlinkPath),
  );
  await saveRegistry(registry);
}

/**
 * Get a single skill's registry entry.
 */
export async function getEntry(name: string): Promise<RegistryEntry | null> {
  const registry = await loadRegistry();
  return registry.skills[name] || null;
}
