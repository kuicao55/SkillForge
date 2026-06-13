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

export const directoryBrowser = createPrompt<string, DirectoryBrowserConfig>(
  (config, done) => {
    const [currentDir, setCurrentDir] = useState(config.rootDir);
    const [items, setItems] = useState<string[]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect((setStale) => {
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
        // ESC: go to parent, or exit if at root
        const parent = path.dirname(currentDir);
        if (parent !== currentDir) {
          setCurrentDir(parent);
        } else {
          process.exit(0);
        }
      } else if (isUpKey(key)) {
        setCursor(cursor > 0 ? cursor - 1 : Math.max(0, items.length - 1));
      } else if (isDownKey(key)) {
        setCursor(cursor < items.length - 1 ? cursor + 1 : 0);
      } else if (isRightKey(key) && items.length > 0) {
        const selected = items[cursor];
        setCurrentDir(path.join(currentDir, selected));
      } else if (isLeftKey(key)) {
        const parent = path.dirname(currentDir);
        if (parent !== currentDir) {
          setCurrentDir(parent);
        }
      } else if (isEnterKey(key)) {
        done(currentDir);
      }
    });

    const relPath = currentDir === config.rootDir
      ? path.basename(config.rootDir)
      : currentDir.replace(config.rootDir, '').replace(/^\//, '') || '.';

    let output = `${prefix} ${config.message}\n`;
    output += `  ${chalk.gray('📁')} ${chalk.bold(relPath)}\n\n`;

    if (loading) {
      output += `  ${chalk.gray('Loading...')}`;
    } else if (items.length === 0) {
      output += `  ${chalk.gray('(empty — press ↵ to select this directory)')}`;
    } else {
      const displayItems = items.slice(0, 20);
      for (let i = 0; i < displayItems.length; i++) {
        const isSelected = i === cursor;
        const icon = isSelected ? chalk.cyan('❯ ') : '  ';
        const name = isSelected ? chalk.cyan.bold(displayItems[i]) : displayItems[i];
        output += `  ${icon}${name}\n`;
      }
      if (items.length > 20) {
        output += `  ${chalk.gray(`... and ${items.length - 20} more`)}\n`;
      }
    }

    output += `\n  ${chalk.gray('↑↓ browse  → enter  ← back  ↵ select  esc back/exit')}`;

    return output;
  },
);
