import fs from 'fs-extra';
import chalk from 'chalk';
import { loadRegistry } from '../../core/registry/manager.js';
import { isBrokenSymlink } from '../../core/link/manager.js';
import { log } from '../../utils/logger.js';

export async function doctorCommand(): Promise<void> {
  console.log(chalk.bold('\n⚒  SkillForge Doctor\n'));

  const registry = await loadRegistry();
  let issues = 0;
  let healthy = 0;

  for (const [name, entry] of Object.entries(registry.skills)) {
    // Check if skill directory still exists
    if (!await fs.pathExists(entry.installPath)) {
      log.warn(`Skill "${name}": install path missing (${entry.installPath})`);
      issues++;
    }

    // Check all links
    for (const link of entry.links) {
      if (await isBrokenSymlink(link.symlinkPath)) {
        log.warn(`Skill "${name}": broken link → ${link.symlinkPath}`);
        issues++;
      } else if (!await fs.pathExists(link.symlinkPath)) {
        log.warn(`Skill "${name}": link target missing → ${link.symlinkPath}`);
        issues++;
      } else {
        healthy++;
      }
    }
  }

  console.log('');
  if (issues === 0) {
    log.success(`All ${healthy} link(s) are healthy. No issues found.`);
  } else {
    log.warn(`Found ${issues} issue(s). ${healthy} link(s) healthy.`);
  }
  console.log('');
}
