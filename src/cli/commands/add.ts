import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import matter from 'gray-matter';
import chalk from 'chalk';
import ora from 'ora';
import { getSkillSourceDirs, getConfigDir } from '../../utils/paths.js';
import { parseSkillMd } from '../../core/skill/parser.js';
import { parseSource, parseSkillOptions, toPackageName } from '../../core/skill/source.js';
import { getEntry, registerSkill } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';

export interface AddOptions {
  skill?: string[];
}

interface DownloadedSkill {
  /** Directory name used by the upstream repository. */
  dirName: string;
  /** Absolute path inside the download cache. */
  sourcePath: string;
  /** Name from SKILL.md frontmatter (or the directory name as a fallback). */
  skillName: string;
}

function getCacheDir(): string {
  return path.join(getConfigDir(), 'cache');
}

/** Quote a value for the shell used by execSync. */
function shellQuote(value: string): string {
  if (process.platform === 'win32') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildAddCommand(source: string, skills: string[]): string {
  const parts = ['npx', 'skills', 'add', shellQuote(source)];

  if (skills.length > 0) {
    parts.push('--skill', ...skills.map(shellQuote));
    // `--all` implies `--skill '*'` and would override the explicit selection,
    // so request every agent and skip prompts instead.
    parts.push('--agent', shellQuote('*'), '--yes');
  } else {
    parts.push('--all');
  }

  return parts.join(' ');
}

/** Collect every downloaded skill directory that contains a SKILL.md. */
async function findDownloadedSkills(
  agentsSkillsDir: string,
  requested: string[],
): Promise<DownloadedSkill[]> {
  if (!await fs.pathExists(agentsSkillsDir)) {
    return [];
  }

  const entries = await fs.readdir(agentsSkillsDir, { withFileTypes: true });
  const found: DownloadedSkill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const sourcePath = path.join(agentsSkillsDir, entry.name);
    const skillMdPath = path.join(sourcePath, 'SKILL.md');
    if (!await fs.pathExists(skillMdPath)) continue;

    const raw = await fs.readFile(skillMdPath, 'utf-8');
    const { data } = matter(raw);
    const frontmatterName = typeof data.name === 'string' ? data.name.trim() : '';
    const skillName = frontmatterName || entry.name;

    found.push({ dirName: entry.name, sourcePath, skillName });
  }

  if (requested.length > 0) {
    const installed = new Set(found.map(f => f.skillName));
    const missing = requested.filter(name => !installed.has(name));
    if (missing.length > 0) {
      log.warn(`Requested skill(s) not found in download: ${missing.join(', ')}`);
    }
  }

  return found;
}

/**
 * Copy a downloaded skill into Community/<metadata.name>, stamp the package
 * field, and register it (preserving existing links).
 */
async function importSkill(downloaded: DownloadedSkill, packageSource: string): Promise<string> {
  const communityDir = getSkillSourceDirs().community;
  const targetPath = path.join(communityDir, downloaded.skillName);

  await fs.ensureDir(communityDir);

  // Overwrite an existing copy so updates don't leave stale files behind.
  if (await fs.pathExists(targetPath)) {
    await fs.remove(targetPath);
  }
  await fs.copy(downloaded.sourcePath, targetPath);

  // Remove a stale install that landed under the upstream directory name
  // (can differ from the metadata name, e.g. taste-skill / design-taste-frontend).
  if (downloaded.dirName !== downloaded.skillName) {
    const stalePath = path.join(communityDir, downloaded.dirName);
    if (await fs.pathExists(stalePath)) {
      const staleSkill = await parseSkillMd(path.join(stalePath, 'SKILL.md'));
      if (staleSkill?.metadata.name === downloaded.skillName) {
        await fs.remove(stalePath);
        log.muted(`  Removed stale copy: ${stalePath}`);
      }
    }
  }

  // Write the package field, preserving all other frontmatter and the body.
  const skillMdPath = path.join(targetPath, 'SKILL.md');
  const raw = await fs.readFile(skillMdPath, 'utf-8');
  const parsed = matter(raw);
  parsed.data.package = packageSource;
  await fs.writeFile(skillMdPath, matter.stringify(parsed.content, parsed.data), 'utf-8');

  const skill = await parseSkillMd(skillMdPath);
  if (!skill) {
    log.warn(`  Skipped registry entry for ${downloaded.skillName}: invalid SKILL.md`);
    return targetPath;
  }

  // Update in place rather than replacing the entry, so links survive a reinstall.
  const existing = await getEntry(skill.metadata.name);
  await registerSkill({
    name: skill.metadata.name,
    source: 'community',
    installPath: targetPath,
    installedAt: existing?.installedAt ?? new Date().toISOString(),
    links: existing?.links ?? [],
  });

  return targetPath;
}

export async function addCommand(source: string, options: AddOptions = {}): Promise<void> {
  const parsedSource = parseSource(source);
  const skills = parseSkillOptions(options.skill);

  const label = skills.length > 0 ? `${parsedSource.value} (${skills.join(', ')})` : parsedSource.value;
  console.log(chalk.bold(`\n⚒  Adding skill: ${label}\n`));

  const spinner = ora('Downloading skill...').start();
  const cacheDir = getCacheDir();

  try {
    // Clean cache to avoid stale state from previous runs
    await fs.remove(cacheDir);
    await fs.ensureDir(cacheDir);

    const command = buildAddCommand(parsedSource.value, skills);
    let output: string;
    try {
      output = execSync(command, {
        cwd: cacheDir,
        encoding: 'utf-8',
        timeout: 120000,
      });
    } catch (err: any) {
      spinner.fail('Failed to download skill');
      log.error(`Command: ${command}`);
      log.error(`Exit code: ${err.status}`);
      if (err.stdout) log.error(`stdout: ${err.stdout.slice(0, 500)}`);
      if (err.stderr) log.error(`stderr: ${err.stderr.slice(0, 500)}`);
      return;
    }

    log.muted(`npx output (last 300 chars): ...${output.slice(-300)}`);

    spinner.text = 'Importing skill...';

    // npx skills installs to .agents/skills/<skill-dir>
    const agentsSkillsDir = path.join(cacheDir, '.agents', 'skills');
    const downloaded = await findDownloadedSkills(agentsSkillsDir, skills);

    if (downloaded.length === 0) {
      spinner.fail('Downloaded skill not found');
      log.error(`Expected: ${agentsSkillsDir}`);
      log.error(`Cache dir exists: ${await fs.pathExists(cacheDir)}`);
      if (await fs.pathExists(cacheDir)) {
        const contents = await fs.readdir(cacheDir);
        log.error(`Cache contents: ${contents.join(', ')}`);
      }
      return;
    }

    const packageName = toPackageName(parsedSource);
    const imported: string[] = [];
    for (const item of downloaded) {
      imported.push(await importSkill(item, packageName));
    }

    spinner.succeed(`Imported ${imported.length} skill(s) into Community/`);
    for (const targetPath of imported) {
      log.muted(`  ${path.basename(targetPath)}: ${targetPath}`);
    }
    log.muted(`  Package: ${packageName}`);
  } catch (err) {
    spinner.fail('Failed to add skill');
    log.error(err instanceof Error ? err.message : String(err));
  } finally {
    // Always clean the download cache, including on failure.
    await fs.remove(cacheDir);
  }
}
