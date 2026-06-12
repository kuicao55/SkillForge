import fs from 'fs-extra';
import path from 'node:path';
import { type AgentDefinition } from '../../types/agent.js';
import { resolveProjectSkillsDir, resolveGlobalSkillsDir } from '../agent/manager.js';
import { addLink, removeLink } from '../registry/manager.js';

/**
 * Create a symlink from a skill directory to an agent's project skills directory.
 */
export async function linkSkill(
  skillName: string,
  skillPath: string,
  agent: AgentDefinition,
  projectPath: string,
): Promise<string> {
  const targetDir = resolveProjectSkillsDir(agent, projectPath);
  await fs.ensureDir(targetDir);

  const symlinkPath = path.join(targetDir, skillName);

  // Remove existing link if it exists
  if (await fs.pathExists(symlinkPath)) {
    const stat = await fs.lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      await fs.remove(symlinkPath);
    } else {
      throw new Error(`Path ${symlinkPath} exists but is not a symlink. Aborting.`);
    }
  }

  await fs.symlink(skillPath, symlinkPath, 'dir');

  // Record in registry
  await addLink(skillName, {
    agent: agent.config.name,
    projectPath,
    symlinkPath,
    createdAt: new Date().toISOString(),
  });

  return symlinkPath;
}

/**
 * Remove a symlink from an agent's project skills directory.
 */
export async function unlinkSkill(
  skillName: string,
  agent: AgentDefinition,
  projectPath: string,
): Promise<void> {
  const targetDir = resolveProjectSkillsDir(agent, projectPath);
  const symlinkPath = path.join(targetDir, skillName);

  if (await fs.pathExists(symlinkPath)) {
    const stat = await fs.lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      await fs.remove(symlinkPath);
    }
  }

  // Remove from registry
  await removeLink(skillName, agent.config.name, projectPath, symlinkPath);
}

/**
 * Link a skill to an agent's global skills directory.
 */
export async function enableSkillGlobally(
  skillName: string,
  skillPath: string,
  agent: AgentDefinition,
): Promise<string> {
  const targetDir = resolveGlobalSkillsDir(agent);
  await fs.ensureDir(targetDir);

  const symlinkPath = path.join(targetDir, skillName);

  if (await fs.pathExists(symlinkPath)) {
    const stat = await fs.lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      await fs.remove(symlinkPath);
    } else {
      throw new Error(`Path ${symlinkPath} exists but is not a symlink. Aborting.`);
    }
  }

  await fs.symlink(skillPath, symlinkPath, 'dir');

  await addLink(skillName, {
    agent: agent.config.name,
    projectPath: '__global__',
    symlinkPath,
    createdAt: new Date().toISOString(),
  });

  return symlinkPath;
}

/**
 * Remove a skill from an agent's global skills directory.
 */
export async function disableSkillGlobally(
  skillName: string,
  agent: AgentDefinition,
): Promise<void> {
  const targetDir = resolveGlobalSkillsDir(agent);
  const symlinkPath = path.join(targetDir, skillName);

  if (await fs.pathExists(symlinkPath)) {
    const stat = await fs.lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      await fs.remove(symlinkPath);
    }
  }

  await removeLink(skillName, agent.config.name, '__global__', symlinkPath);
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
