import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix } from '@inquirer/core';
import chalk from 'chalk';

export function confirmPrompt() {
  return createPrompt<boolean | null, { message: string }>((config, done) => {
    const { message } = config;
    const [cursor, setCursor] = useState(0); // 0 = Yes, 1 = No
    const prefix = usePrefix({});

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        done(null);
      } else if (isUpKey(key) || isDownKey(key)) {
        setCursor(cursor === 0 ? 1 : 0);
      } else if (isEnterKey(key)) {
        done(cursor === 0);
      }
    });

    const options = ['Yes', 'No'];
    let output = `${prefix} ${message}\n`;
    for (let i = 0; i < options.length; i++) {
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(options[i]) : options[i];
      output += `  ${icon}${label}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ toggle  ↵ select  esc back')}`;
    return output;
  });
}
