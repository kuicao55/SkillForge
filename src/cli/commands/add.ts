import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import chalk from 'chalk';
import ora from 'ora';
import { getSkillSourceDirs } from '../../utils/paths.js';
import { parseSkillMd } from '../../core/skill/parser.js';
import { registerSkill } from '../../core/registry/manager.js';
import { log } from '../../utils/logger.js';

export async function addCommand(name: string): Promise<void> {
  console.log(chalk.bold(`\n⚒  Adding skill: ${name}\n`));

  const spinner = ora('Downloading skill...').start();

  try {
    // Use npx skills to download
    const tmpDir = path.join(os.tmpdir(), `skillforge-${Date.now()}`);
    await fs.ensureDir(tmpDir);

    try {
      execSync(`npx skills add ${name}`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 60000,
      });
    } catch (err) {
      spinner.fail('Failed to download skill');
      log.error(`npx skills add ${name} failed. Is the skill name correct?`);
      return;
    }

    spinner.text = 'Importing skill...';

    // Find the downloaded skill directory
    const skillDirName = name.includes('/') ? name.split('/').pop()! : name;
    const downloadedPath = path.join(tmpDir, skillDirName);
    if (!await fs.pathExists(downloadedPath)) {
      // Try finding it in the tmpDir
      const entries = await fs.readdir(tmpDir);
      const found = entries.find(e => e !== 'node_modules' && e !== 'package.json' && e !== 'package-lock.json');
      if (found) {
        const altPath = path.join(tmpDir, found);
        const stat = await fs.lstat(altPath);
        if (stat.isDirectory()) {
          await copySkill(altPath, skillDirName);
        }
      } else {
        spinner.fail('Downloaded skill directory not found');
        return;
      }
    } else {
      await copySkill(downloadedPath, skillDirName);
    }

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
    await fs.remove(tmpDir);

    spinner.succeed(`Skill ${chalk.bold(name)} added to Community/`);
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
