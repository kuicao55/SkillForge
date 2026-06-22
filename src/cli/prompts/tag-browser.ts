import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { findAllTags } from '../../core/skill/discovery.js';

export const tagBrowser = createPrompt<string, { message: string }>(
  (config, done) => {
    const [tags, setTags] = useState<[string, number][]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect(() => {
      findAllTags().then(tagMap => {
        const sorted = Array.from(tagMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        setTags(sorted);
        setLoading(false);
      });
    }, []);

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        process.exit(0);
      } else if (isUpKey(key)) {
        setCursor(cursor > 0 ? cursor - 1 : Math.max(0, tags.length - 1));
      } else if (isDownKey(key)) {
        setCursor(cursor < tags.length - 1 ? cursor + 1 : 0);
      } else if (isEnterKey(key) && tags.length > 0) {
        done(tags[cursor][0]);
      }
    });

    if (loading) {
      return `${prefix} Loading tags...`;
    }

    if (tags.length === 0) {
      return `${prefix} ${config.message}\n\n  ${chalk.yellow('No tags found.')}\n`;
    }

    let output = `${prefix} ${config.message}\n`;
    for (let i = 0; i < tags.length; i++) {
      const [tag, count] = tags[i];
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(tag) : tag;
      output += `  ${icon}${chalk.magenta('●')} ${label} ${chalk.gray(`(${count} skill${count !== 1 ? 's' : ''})`)}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ select  esc exit')}`;
    return output;
  },
);
