import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { discoverSkills } from '../../core/skill/discovery.js';
import { loadRegistry } from '../../core/registry/manager.js';
import { loadAgents } from '../../core/agent/manager.js';
import type { Skill, SkillSource } from '../../types/skill.js';

type MenuView = 'list' | 'info' | 'actions';

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
    const [actionCursor, setActionCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect((setStale) => {
      Promise.all([discoverSkills(), loadRegistry(), loadAgents()]).then(([cats, _reg, _agents]) => {
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
      if (view === 'list') {
        if (isUpKey(key)) {
          setCursor(cursor > 0 ? cursor - 1 : Math.max(0, skills.length - 1));
        } else if (isDownKey(key)) {
          setCursor(cursor < skills.length - 1 ? cursor + 1 : 0);
        } else if (isEnterKey(key) && skills.length > 0) {
          setView('info');
          setActionCursor(0);
        }
      } else if (view === 'info') {
        if (isUpKey(key)) {
          setActionCursor(actionCursor > 0 ? actionCursor - 1 : 2);
        } else if (isDownKey(key)) {
          setActionCursor(actionCursor < 2 ? actionCursor + 1 : 0);
        } else if (isEnterKey(key)) {
          const selected = skills[cursor];
          const skillName = selected.skill.metadata.name;
          if (actionCursor === 0) {
            // Back to list
            setView('list');
          } else if (actionCursor === 1) {
            // Link
            done(`link:${skillName}`);
          } else if (actionCursor === 2) {
            // Unlink
            done(`unlink:${skillName}`);
          }
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

    if (view === 'list') {
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
      output += `\n  ${chalk.gray('↑↓ navigate  ↵ view details')}`;
      return output;
    }

    // Info view
    const selected = skills[cursor];
    const meta = selected.skill.metadata;
    const sourceLabel = getSourceLabel(selected.skill, selected.source);

    let output = `${prefix} ${chalk.bold(meta.name)}\n\n`;
    if (meta.description) output += `  ${meta.description}\n\n`;
    output += `  ${chalk.gray('Source:')}   ${sourceLabel}\n`;
    output += `  ${chalk.gray('Path:')}     ${selected.skill.path}\n`;
    if (meta.version) output += `  ${chalk.gray('Version:')}  ${meta.version}\n`;
    if (meta.author) output += `  ${chalk.gray('Author:')}   ${meta.author}\n`;
    if (meta.tags?.length) output += `  ${chalk.gray('Tags:')}     ${meta.tags.join(', ')}\n`;

    // Actions
    const actions = ['← Back to list', 'Link to project', 'Unlink'];
    output += `\n  ${chalk.gray('Actions:')}\n`;
    for (let i = 0; i < actions.length; i++) {
      const isSelected = i === actionCursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(actions[i]) : actions[i];
      output += `  ${icon}${label}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ select')}`;

    return output;
  },
);
