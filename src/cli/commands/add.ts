import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import matter from 'gray-matter';
import chalk from 'chalk';
import ora from 'ora';
import { getSkillSourceDirs, getConfigDir } from '../../utils/paths.js';
import { parseSkillMd } from '../../core/skill/parser.js';
import { registerSkill } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';

function getCacheDir(): string {
  return path.join(getConfigDir(), 'cache');
}

export async function addCommand(name: string): Promise<void> {
  console.log(chalk.bold(`\n⚒  Adding skill: ${name}\n`));

  const spinner = ora('Downloading skill...').start();

  try {
    const cacheDir = getCacheDir();
    // Clean cache to avoid stale state from previous runs
    await fs.remove(cacheDir);
    await fs.ensureDir(cacheDir);

    try {
      execSync(`npx skills add ${name}`, {
        cwd: cacheDir,
        stdio: 'pipe',
        timeout: 120000,
      });
    } catch (err) {
      spinner.fail('Failed to download skill');
      log.error(`npx skills add ${name} failed. Is the skill name correct?`);
      await fs.remove(cacheDir);
      return;
    }

    spinner.text = 'Importing skill...';

    // npx skills installs to .agents/skills/<skill-name>
    const agentsSkillsDir = path.join(cacheDir, '.agents', 'skills');
    let skillSourcePath: string | null = null;
    let skillDirName: string | null = null;

    if (await fs.pathExists(agentsSkillsDir)) {
      const entries = await fs.readdir(agentsSkillsDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory());
      if (dirs.length > 0) {
        skillDirName = dirs[0].name;
        skillSourcePath = path.join(agentsSkillsDir, skillDirName);
      }
    }

    if (!skillSourcePath || !skillDirName) {
      spinner.fail('Downloaded skill not found');
      log.error(`Expected: ${agentsSkillsDir}`);
      log.error(`Cache dir exists: ${await fs.pathExists(cacheDir)}`);
      if (await fs.pathExists(cacheDir)) {
        const contents = await fs.readdir(cacheDir);
        log.error(`Cache contents: ${contents.join(', ')}`);
      }
      await fs.remove(cacheDir);
      return;
    }

    // Copy to Community/
    await copySkill(skillSourcePath, skillDirName);

    // Write package name to SKILL.md frontmatter
    const communityDir = getSkillSourceDirs().community;
    const skillMdPath = path.join(communityDir, skillDirName, 'SKILL.md');

    if (await fs.pathExists(skillMdPath)) {
      const raw = await fs.readFile(skillMdPath, 'utf-8');
      const parsed = matter(raw);
      parsed.data.package = name;
      const updated = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(skillMdPath, updated, 'utf-8');

      // Register in registry
      const skill = await parseSkillMd(skillMdPath);
      if (skill) {
        await registerSkill({
          name: skill.metadata.name,
          source: 'community',
          installPath: path.join(communityDir, skillDirName),
          installedAt: new Date().toISOString(),
          links: [],
        });
      }
    }

    // Cleanup
    await fs.remove(cacheDir);

    spinner.succeed(`Skill ${chalk.bold(skillDirName)} added to Community/`);
    log.muted(`  Package: ${name}`);
    log.muted(`  Path: ${path.join(communityDir, skillDirName)}`);
  } catch (err) {
    spinner.fail('Failed to add skill');
    log.error(err instanceof Error ? err.message : String(err));
  }
}

async function copySkill(sourcePath: string, name: string): Promise<void> {
  const communityDir = getSkillSourceDirs().community;
  const targetPath = path.join(communityDir, name);

  if (await fs.pathExists(targetPath)) {
    await fs.remove(targetPath);
  }

  await fs.copy(sourcePath, targetPath);
}
