import fs from 'fs-extra';
import path from 'node:path';
import { type LinkDestination, CLAUDE_SKILLS, AGENTS_SKILLS, CLAUDE_GLOBAL_SKILLS, AGENTS_GLOBAL_SKILLS } from '../../types/destination.js';
import { expandHome } from '../../utils/paths.js';
import { addLink, removeLink } from '../registry/manager.js';

/** Resolve the project-level skills directories for a destination. */
function resolveProjectDirs(destination: LinkDestination, projectPath: string): string[] {
  const base = expandHome(projectPath);
  switch (destination) {
    case 'claude':
      return [path.join(base, CLAUDE_SKILLS)];
    case 'others':
      return [path.join(base, AGENTS_SKILLS)];
    case 'all':
      return [path.join(base, CLAUDE_SKILLS), path.join(base, AGENTS_SKILLS)];
  }
}

/** Resolve the global skills directories for a destination. */
function resolveGlobalDirs(destination: LinkDestination): string[] {
  switch (destination) {
    case 'claude':
      return [expandHome(CLAUDE_GLOBAL_SKILLS)];
    case 'others':
      return [expandHome(AGENTS_GLOBAL_SKILLS)];
    case 'all':
      return [expandHome(CLAUDE_GLOBAL_SKILLS), expandHome(AGENTS_GLOBAL_SKILLS)];
  }
}

/**
 * Create a symlink (or symlinks for 'all') from a skill directory to the
 * destination's project skills directory.
 */
export async function linkSkill(
  skillName: string,
  skillPath: string,
  destination: LinkDestination,
  projectPath: string,
): Promise<string[]> {
  const targetDirs = resolveProjectDirs(destination, projectPath);
  const created: string[] = [];

  for (const targetDir of targetDirs) {
    await fs.ensureDir(targetDir);

    const symlinkPath = path.join(targetDir, skillName);

    // Determine actual destination for this specific dir
    const actualDest: LinkDestination = targetDir.endsWith(CLAUDE_SKILLS) ? 'claude' : 'others';

    // If symlink already points to the same skill, skip silently
    if (await fs.pathExists(symlinkPath)) {
      const stat = await fs.lstat(symlinkPath);
      if (stat.isSymbolicLink()) {
        const existingTarget = await fs.realpath(symlinkPath);
        const resolvedSkill = await fs.realpath(skillPath);
        if (existingTarget === resolvedSkill) {
          continue; // already linked, skip
        }
        await fs.remove(symlinkPath);
      } else {
        throw new Error(`Path ${symlinkPath} exists but is not a symlink. Aborting.`);
      }
    }

    await fs.symlink(skillPath, symlinkPath, 'dir');

    // Record in registry
    await addLink(
      skillName,
      {
        destination: actualDest,
        projectPath,
        symlinkPath,
        createdAt: new Date().toISOString(),
      },
      skillPath,
    );

    created.push(symlinkPath);
  }

  return created;
}

/**
 * Remove symlink(s) from the destination's project skills directory.
 */
export async function unlinkSkill(
  skillName: string,
  destination: LinkDestination,
  projectPath: string,
): Promise<void> {
  // Determine actual destinations to remove
  const destinations: LinkDestination[] = destination === 'all' ? ['claude', 'others'] : [destination];

  for (const dest of destinations) {
    const targetDirs = resolveProjectDirs(dest, projectPath);

    for (const targetDir of targetDirs) {
      const symlinkPath = path.join(targetDir, skillName);

      if (await fs.pathExists(symlinkPath)) {
        const stat = await fs.lstat(symlinkPath);
        if (stat.isSymbolicLink()) {
          await fs.remove(symlinkPath);
        }
      }

      // Remove from registry
      await removeLink(skillName, dest, projectPath, symlinkPath);
    }
  }
}

/**
 * Link a skill to the destination's global skills directory.
 */
export async function enableSkillGlobally(
  skillName: string,
  skillPath: string,
  destination: LinkDestination,
): Promise<string[]> {
  const targetDirs = resolveGlobalDirs(destination);
  const created: string[] = [];

  for (const targetDir of targetDirs) {
    await fs.ensureDir(targetDir);

    const symlinkPath = path.join(targetDir, skillName);
    const actualDest: LinkDestination = targetDir.includes('claude') ? 'claude' : 'others';

    // If symlink already points to the same skill, skip silently
    if (await fs.pathExists(symlinkPath)) {
      const stat = await fs.lstat(symlinkPath);
      if (stat.isSymbolicLink()) {
        const existingTarget = await fs.realpath(symlinkPath);
        const resolvedSkill = await fs.realpath(skillPath);
        if (existingTarget === resolvedSkill) {
          continue; // already linked, skip
        }
        await fs.remove(symlinkPath);
      } else {
        throw new Error(`Path ${symlinkPath} exists but is not a symlink. Aborting.`);
      }
    }

    await fs.symlink(skillPath, symlinkPath, 'dir');

    await addLink(
      skillName,
      {
        destination: actualDest,
        projectPath: '__global__',
        symlinkPath,
        createdAt: new Date().toISOString(),
      },
      skillPath,
    );

    created.push(symlinkPath);
  }

  return created;
}

/**
 * Remove a skill from the destination's global skills directory.
 */
export async function disableSkillGlobally(
  skillName: string,
  destination: LinkDestination,
): Promise<void> {
  const destinations: LinkDestination[] = destination === 'all' ? ['claude', 'others'] : [destination];

  for (const dest of destinations) {
    const targetDirs = resolveGlobalDirs(dest);

    for (const targetDir of targetDirs) {
      const symlinkPath = path.join(targetDir, skillName);

      if (await fs.pathExists(symlinkPath)) {
        const stat = await fs.lstat(symlinkPath);
        if (stat.isSymbolicLink()) {
          await fs.remove(symlinkPath);
        }
      }

      await removeLink(skillName, dest, '__global__', symlinkPath);
    }
  }
}

/**
 * Check if a symlink is broken (target doesn't exist).
 */
export async function isBrokenSymlink(symlinkPath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(symlinkPath);
    if (!stat.isSymbolicLink()) return false;
    await fs.access(symlinkPath);
    return false;
  } catch {
    return true;
  }
}
