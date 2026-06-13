import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';

interface DirectoryBrowserConfig {
  message: string;
  rootDir: string;
}

function isLeftKey(key: { name?: string; sequence?: string }): boolean {
  return key.name === 'left';
}

function isRightKey(key: { name?: string; sequence?: string }): boolean {
  return key.name === 'right';
}

async function listDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)
      .sort();
  } catch {
    return [];
  }
}

// First item is always "select current directory"
const SELECT_CURRENT = '__select_current__';

export const directoryBrowser = createPrompt<string, DirectoryBrowserConfig>(
  (config, done) => {
    const [currentDir, setCurrentDir] = useState(config.rootDir);
    const [items, setItems] = useState<string[]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    // Build display list: [select current, ...subdirs]
    const displayItems = [SELECT_CURRENT, ...items];

    useEffect(() => {
      setLoading(true);
      listDirs(currentDir).then(dirs => {
        setItems(dirs);
        setCursor(0);
        setLoading(false);
      });
    }, [currentDir]);

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        const parent = path.dirname(currentDir);
        if (parent !== currentDir) {
          setCurrentDir(parent);
        } else {
          process.exit(0);
        }
      } else if (isUpKey(key)) {
        setCursor(cursor > 0 ? cursor - 1 : displayItems.length - 1);
      } else if (isDownKey(key)) {
        setCursor(cursor < displayItems.length - 1 ? cursor + 1 : 0);
      } else if (isRightKey(key) && cursor > 0) {
        // Enter subdir (skip "select current" item)
        const selected = items[cursor - 1];
        setCurrentDir(path.join(currentDir, selected));
      } else if (isLeftKey(key)) {
        const parent = path.dirname(currentDir);
        if (parent !== currentDir) {
          setCurrentDir(parent);
        }
      } else if (isEnterKey(key)) {
        if (cursor === 0) {
          // "Select current directory"
          done(currentDir);
        } else {
          // Select the highlighted subdirectory
          const selected = items[cursor - 1];
          done(path.join(currentDir, selected));
        }
      }
    });

    const relPath = currentDir === config.rootDir
      ? path.basename(config.rootDir)
      : currentDir.replace(config.rootDir, '').replace(/^\//, '') || '.';

    let output = `${prefix} ${config.message}\n`;
    output += `  ${chalk.gray('📁')} ${chalk.bold(relPath)}\n\n`;

    if (loading) {
      output += `  ${chalk.gray('Loading...')}`;
    } else {
      for (let i = 0; i < displayItems.length; i++) {
        const isSelected = i === cursor;
        const icon = isSelected ? chalk.cyan('❯ ') : '  ';

        if (i === 0) {
          // "Select current directory" option
          const label = isSelected
            ? chalk.cyan.bold(`📁 Select "${path.basename(currentDir)}"`)
            : chalk.gray(`📁 Select "${path.basename(currentDir)}"`);
          output += `  ${icon}${label}\n`;
        } else {
          const name = isSelected ? chalk.cyan.bold(displayItems[i]) : displayItems[i];
          output += `  ${icon}${name}\n`;
        }
      }
    }

    output += `\n  ${chalk.gray('↑↓ browse  ↵ select  → enter dir  ← back  esc back/exit')}`;

    return output;
  },
);
