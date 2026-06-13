import fs from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { loadRegistry, saveRegistry, removeLink } from '../../core/registry/manager.js';
import { isBrokenSymlink } from '../../core/link/manager.js';
import { getConfigDir, expandHome } from '../../utils/paths.js';
import { CLAUDE_SKILLS, AGENTS_SKILLS, CLAUDE_GLOBAL_SKILLS, AGENTS_GLOBAL_SKILLS } from '../../types/destination.js';
import { log } from '../../utils/logger.js';

interface CheckResult {
  label: string;
  ok: boolean;
  detail?: string;
}

export async function cleanCommand(): Promise<void> {
  console.log(chalk.bold('\n⚒  SkillForge Clean\n'));

  const registry = await loadRegistry();
  const results: CheckResult[] = [];
  let totalRemoved = 0;

  // ── 1. Clean dangling symlinks from registry ──────────────────────
  console.log(chalk.gray('  Checking registry link integrity...'));
  for (const [name, entry] of Object.entries(registry.skills)) {
    const linksToRemove: { destination: string; projectPath: string; symlinkPath: string }[] = [];

    for (const link of entry.links) {
      if (await isBrokenSymlink(link.symlinkPath)) {
        try { await fs.remove(link.symlinkPath); } catch { /* ignore */ }
        linksToRemove.push(link);
        totalRemoved++;
      }
    }

    for (const link of linksToRemove) {
      await removeLink(name, link.destination, link.projectPath, link.symlinkPath);
    }

    if (linksToRemove.length > 0) {
      results.push({
        label: `Broken links for "${name}"`,
        ok: false,
        detail: `removed ${linksToRemove.length} dangling symlink(s)`,
      });
    }
  }

  // ── 2. Scan directories for unrecorded broken symlinks ────────────
  console.log(chalk.gray('  Scanning skill directories...'));
  const dirsToScan = new Set<string>();

  // Global dirs
  dirsToScan.add(expandHome(CLAUDE_GLOBAL_SKILLS));
  dirsToScan.add(expandHome(AGENTS_GLOBAL_SKILLS));

  // Project dirs from registry
  for (const entry of Object.values(registry.skills)) {
    for (const link of entry.links) {
      if (link.projectPath !== '__global__') {
        dirsToScan.add(path.join(expandHome(link.projectPath), CLAUDE_SKILLS));
        dirsToScan.add(path.join(expandHome(link.projectPath), AGENTS_SKILLS));
      }
    }
  }

  // Also scan current working directory's skill dirs
  const cwd = process.cwd();
  dirsToScan.add(path.join(cwd, CLAUDE_SKILLS));
  dirsToScan.add(path.join(cwd, AGENTS_SKILLS));

  for (const dir of dirsToScan) {
    if (!await fs.pathExists(dir)) continue;

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isSymbolicLink()) continue;

      const symlinkPath = path.join(dir, entry.name);
      if (await isBrokenSymlink(symlinkPath)) {
        try { await fs.remove(symlinkPath); } catch { /* ignore */ }
        totalRemoved++;
        results.push({
          label: `Unrecorded broken symlink`,
          ok: false,
          detail: `removed ${symlinkPath}`,
        });
      }
    }
  }

  // ── 3. Clean orphan skill entries (installPath missing) ───────────
  console.log(chalk.gray('  Checking skill install paths...'));
  const orphanEntries: string[] = [];
  for (const [name, entry] of Object.entries(registry.skills)) {
    if (entry.installPath && !await fs.pathExists(entry.installPath)) {
      // Also clean any remaining symlinks in projects
      for (const link of entry.links) {
        if (await fs.pathExists(link.symlinkPath)) {
          const stat = await fs.lstat(link.symlinkPath);
          if (stat.isSymbolicLink()) {
            try { await fs.remove(link.symlinkPath); } catch { /* ignore */ }
            totalRemoved++;
          }
        }
      }
      orphanEntries.push(name);
      totalRemoved++;
    }
  }
  for (const name of orphanEntries) {
    delete registry.skills[name];
    results.push({
      label: `Orphan entry "${name}"`,
      ok: false,
      detail: 'install path missing, removed from registry',
    });
  }

  // ── 4. Clean empty-link entries ───────────────────────────────────
  console.log(chalk.gray('  Checking for empty entries...'));
  const emptyEntries: string[] = [];
  for (const [name, entry] of Object.entries(registry.skills)) {
    if (entry.links.length === 0) {
      emptyEntries.push(name);
    }
  }
  for (const name of emptyEntries) {
    delete registry.skills[name];
    results.push({
      label: `Empty entry "${name}"`,
      ok: false,
      detail: 'no links, removed',
    });
  }

  // ── 5. Clean cache directory ─────────────────────────────────────
  console.log(chalk.gray('  Checking cache...'));
  const cacheDir = path.join(getConfigDir(), 'cache');
  if (await fs.pathExists(cacheDir)) {
    const cacheContents = await fs.readdir(cacheDir);
    if (cacheContents.length > 0) {
      await fs.remove(cacheDir);
      results.push({
        label: 'Cache directory',
        ok: false,
        detail: `cleaned ${cacheContents.length} item(s)`,
      });
      totalRemoved++;
    } else {
      results.push({ label: 'Cache directory', ok: true });
    }
  } else {
    results.push({ label: 'Cache directory', ok: true });
  }

  // ── 6. Save registry ─────────────────────────────────────────────
  await saveRegistry(registry);

  // ── 7. Report ────────────────────────────────────────────────────
  const totalLinks = Object.values(registry.skills)
    .reduce((sum, e) => sum + e.links.length, 0);
  const totalSkills = Object.keys(registry.skills).length;

  results.push({
    label: `Registry: ${totalSkills} skill(s), ${totalLinks} link(s)`,
    ok: true,
  });

  console.log('');
  for (const r of results) {
    const icon = r.ok ? chalk.green('  ✓') : chalk.yellow('  ⚠');
    const detail = r.detail ? chalk.gray(` — ${r.detail}`) : '';
    console.log(`${icon} ${r.label}${detail}`);
  }

  console.log('');
  if (totalRemoved === 0) {
    log.success('Everything clean. No issues found.');
  } else {
    log.success(`Cleaned ${totalRemoved} item(s).`);
  }
  console.log('');
}
