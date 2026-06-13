import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix } from '@inquirer/core';
import chalk from 'chalk';

interface SelectChoice<T> {
  name: string;
  value: T;
}

interface SelectConfig<T> {
  message: string;
  choices: SelectChoice<T>[];
}

export function selectPrompt<T>() {
  return createPrompt<T | null, SelectConfig<T>>((config, done) => {
    const { message, choices } = config;
    const [cursor, setCursor] = useState(0);
    const prefix = usePrefix({});

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        done(null);
      } else if (isUpKey(key)) {
        setCursor(cursor > 0 ? cursor - 1 : choices.length - 1);
      } else if (isDownKey(key)) {
        setCursor(cursor < choices.length - 1 ? cursor + 1 : 0);
      } else if (isEnterKey(key)) {
        done(choices[cursor].value);
      }
    });

    let output = `${prefix} ${message}\n`;
    for (let i = 0; i < choices.length; i++) {
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(choices[i].name) : choices[i].name;
      output += `  ${icon}${label}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ select  esc back')}`;
    return output;
  });
}
