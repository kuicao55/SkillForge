import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { discoverSkills } from '../../core/skill/discovery.js';
import type { Skill, SkillSource } from '../../types/skill.js';

type MenuView = 'list' | 'info';

interface SkillItem {
  skill: Skill;
  source: SkillSource;
}

interface InteractiveMenuConfig {
  message: string;
  filterTag?: string;
  showBatchActions?: boolean;
}

function getSourceLabel(skill: Skill, source: SkillSource): string {
  if (source === 'community' && skill.metadata.package) return skill.metadata.package;
  if (source === 'curated') return 'curated';
  if (source === 'experimental') return 'experimental';
  return 'local';
}

// Sentinel value for batch action
const LINK_ALL = '__link_all__';

export const interactiveMenu = createPrompt<string, InteractiveMenuConfig>(
  (config, done) => {
    const { filterTag, showBatchActions = false } = config;
    const [view, setView] = useState<MenuView>('list');
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect(() => {
      discoverSkills().then(cats => {
        let all: SkillItem[] = [
          ...cats.personal.map(s => ({ skill: s, source: 'personal' as SkillSource })),
          ...cats.community.map(s => ({ skill: s, source: 'community' as SkillSource })),
          ...cats.curated.map(s => ({ skill: s, source: 'curated' as SkillSource })),
          ...cats.experimental.map(s => ({ skill: s, source: 'experimental' as SkillSource })),
        ];
        if (filterTag) {
          all = all.filter(item => item.skill.metadata.tags?.includes(filterTag));
        }
        setSkills(all);
        setLoading(false);
      });
    }, []);

    // Build display items: optional batch actions + skill list
    const displayItems: Array<{ type: 'action' | 'skill'; value: string; label: string; skill?: SkillItem }> = [];
    if (showBatchActions && filterTag) {
      displayItems.push({ type: 'action', value: `${LINK_ALL}:${filterTag}`, label: `🔗 Link all to project...` });
    }
    for (const item of skills) {
      displayItems.push({ type: 'skill', value: `info:${item.skill.metadata.name}`, label: item.skill.metadata.name, skill: item });
    }

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
          setCursor(cursor > 0 ? cursor - 1 : Math.max(0, displayItems.length - 1));
        } else if (isDownKey(key)) {
          setCursor(cursor < displayItems.length - 1 ? cursor + 1 : 0);
        } else if (isEnterKey(key) && displayItems.length > 0) {
          done(displayItems[cursor].value);
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
      curated: chalk.magenta,
      experimental: chalk.yellow,
    };

    let output = `${prefix} ${config.message}\n`;
    const maxDisplay = 20;
    const visibleItems = displayItems.slice(0, maxDisplay);
    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';

      if (item.type === 'action') {
        const label = isSelected ? chalk.cyan.bold(item.label) : item.label;
        output += `  ${icon}${label}\n`;
      } else if (item.skill) {
        const color = sourceColors[item.skill.source] || chalk.white;
        const sourceLabel = getSourceLabel(item.skill, item.skill.source);
        const name = isSelected ? chalk.cyan.bold(item.skill.metadata.name) : item.skill.metadata.name;
        const tags = item.skill.metadata.tags?.length ? ` ${chalk.gray(`[${item.skill.metadata.tags.join(', ')}]`)}` : '';
        output += `  ${icon}${color('●')} ${name} ${chalk.gray(`(${sourceLabel})`)}${tags}\n`;
      }
    }
    if (displayItems.length > maxDisplay) {
      output += `  ${chalk.gray(`... and ${displayItems.length - maxDisplay} more`)}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ select  esc exit')}`;
    return output;
  },
);
