import fs from 'fs-extra';
import path from 'node:path';
import { type Registry, type RegistryEntry, type LinkRecord, RegistrySchema } from '../../types/registry.js';
import { getRegistryPath } from '../../utils/paths.js';

/**
 * Remove link records whose symlink files no longer exist on disk.
 * Dangling symlinks (file exists but target gone) are kept for `skill clean` to handle.
 * Also normalizes legacy 'all' destinations.
 * Modifies the registry in place and saves if any changes were made.
 */
async function cleanStaleLinks(registry: Registry): Promise<void> {
  let changed = false;

  for (const entry of Object.values(registry.skills)) {
    const cleanedLinks: LinkRecord[] = [];

    for (const link of entry.links) {
      // Normalize legacy 'all' destination
      if (link.destination === 'all') {
        changed = true;
        // Convert to 'others' — 'claude' record is added separately via addLink
        const normalized = { ...link, destination: 'others' as const };
        // Check if symlink file exists (lstat doesn't follow symlinks)
        if (await symlinkFileExists(normalized.symlinkPath)) {
          cleanedLinks.push(normalized);
        }
        // else: symlink file gone, drop the record
        continue;
      }

      // Check if symlink FILE exists (not the target — keep dangling symlinks)
      if (await symlinkFileExists(link.symlinkPath)) {
        cleanedLinks.push(link);
      } else {
        // Symlink file itself is gone — remove the record
        changed = true;
      }
    }

    if (cleanedLinks.length !== entry.links.length || changed) {
      entry.links = cleanedLinks;
    }
  }

  if (changed) {
    await saveRegistry(registry);
  }
}

/** Check if a symlink file exists on disk without resolving the target. */
async function symlinkFileExists(symlinkPath: string): Promise<boolean> {
  try {
    await fs.lstat(symlinkPath);
    return true;
  } catch {
    return false;
  }
}

const EMPTY_REGISTRY: Registry = { version: 1, skills: {} };

/**
 * Load the registry from disk, creating it if it doesn't exist.
 * Automatically cleans stale links (symlinks that no longer exist on disk).
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
    await cleanStaleLinks(parsed.data);
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
  await fs.ensureDir(path.dirname(registryPath));

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
 * Auto-creates the entry if the skill isn't registered yet.
 * The caller (linkSkill) already provides the correct destination and symlinkPath.
 */
export async function addLink(
  name: string,
  link: LinkRecord,
  skillPath?: string,
): Promise<void> {
  const registry = await loadRegistry();
  let entry = registry.skills[name];

  // Auto-register if not present
  if (!entry) {
    entry = {
      name,
      source: inferSource(skillPath || link.symlinkPath),
      installPath: skillPath || '',
      installedAt: new Date().toISOString(),
      links: [],
    };
    registry.skills[name] = entry;
  }

  // Skip if this destination + projectPath already exists
  const exists = entry.links.some(
    l => l.destination === link.destination && l.projectPath === link.projectPath,
  );
  if (!exists) {
    entry.links.push(link);
    await saveRegistry(registry);
  }
}

function inferSource(filePath: string): 'personal' | 'community' | 'experimental' {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/Community/')) return 'community';
  if (normalized.includes('/Experimental/')) return 'experimental';
  return 'personal';
}

/**
 * Remove a link record from a skill's registry entry.
 */
export async function removeLink(
  name: string,
  destination: string,
  projectPath: string,
  symlinkPath: string,
): Promise<void> {
  const registry = await loadRegistry();
  const entry = registry.skills[name];
  if (!entry) return;

  entry.links = entry.links.filter(
    l => !(l.destination === destination && l.projectPath === projectPath && l.symlinkPath === symlinkPath),
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
