import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { discoverSkills } from '../../core/skill/discovery.js';
import type { Skill, SkillSource } from '../../types/skill.js';

type MenuView = 'list' | 'info';

interface SkillItem {
  skill: Skill;
  source: SkillSource;
}

function getSourceLabel(skill: Skill, source: SkillSource): string {
  if (source === 'community' && skill.metadata.package) return skill.metadata.package;
  if (source === 'experimental') return 'experimental';
  return 'local';
}

export const interactiveMenu = createPrompt<string, { message: string }>(
  (config, done) => {
    const [view, setView] = useState<MenuView>('list');
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect(() => {
      discoverSkills().then(cats => {
        const all: SkillItem[] = [
          ...cats.personal.map(s => ({ skill: s, source: 'personal' as SkillSource })),
          ...cats.community.map(s => ({ skill: s, source: 'community' as SkillSource })),
          ...cats.experimental.map(s => ({ skill: s, source: 'experimental' as SkillSource })),
        ];
        setSkills(all);
        setLoading(false);
      });
    }, []);

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        if (view === 'info') {
          setView('list');
        } else {
          process.exit(0);
        }
      } else if (view === 'list') {
        if (isUpKey(key)) {
          setCursor(cursor > 0 ? cursor - 1 : Math.max(0, skills.length - 1));
        } else if (isDownKey(key)) {
          setCursor(cursor < skills.length - 1 ? cursor + 1 : 0);
        } else if (isEnterKey(key) && skills.length > 0) {
          const selected = skills[cursor];
          done(`info:${selected.skill.metadata.name}`);
        }
      }
    });

    if (loading) {
      return `${prefix} Loading skills...`;
    }

    if (skills.length === 0) {
      return `${prefix} ${config.message}\n\n  ${chalk.yellow('No skills found.')}\n`;
    }

    const sourceColors: Record<string, typeof chalk> = {
      personal: chalk.blue,
      community: chalk.green,
      experimental: chalk.yellow,
    };

    let output = `${prefix} ${config.message}\n`;
    const displaySkills = skills.slice(0, 20);
    for (let i = 0; i < displaySkills.length; i++) {
      const { skill, source } = displaySkills[i];
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const color = sourceColors[source] || chalk.white;
      const sourceLabel = getSourceLabel(skill, source);
      const name = isSelected ? chalk.cyan.bold(skill.metadata.name) : skill.metadata.name;
      output += `  ${icon}${color('●')} ${name} ${chalk.gray(`(${sourceLabel})`)}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ view details  esc exit')}`;
    return output;
  },
);
