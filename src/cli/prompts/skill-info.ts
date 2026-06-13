import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { loadRegistry } from '../../core/registry/manager.js';
import { loadAgents } from '../../core/agent/manager.js';
import type { Skill, SkillSource } from '../../types/skill.js';
import type { Registry } from '../../types/registry.js';
import type { AgentDefinition } from '../../types/agent.js';

export type InfoAction = 'back' | 'link' | 'unlink';

function getSourceLabel(skill: Skill, source: SkillSource): string {
  if (source === 'community' && skill.metadata.package) return skill.metadata.package;
  if (source === 'experimental') return 'experimental';
  return 'local';
}

export const skillInfoPrompt = createPrompt<InfoAction, { skill: Skill; source: SkillSource; showBack?: boolean }>(
  (config, done) => {
    const { skill, source, showBack = true } = config;
    const meta = skill.metadata;
    const [registry, setRegistry] = useState<Registry | null>(null);
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [cursor, setCursor] = useState(0);
    const prefix = usePrefix({});

    const actions = showBack
      ? ['← Back to list', 'Link to project', 'Unlink']
      : ['Link to project', 'Unlink'];

    useEffect(() => {
      Promise.all([loadRegistry(), loadAgents()]).then(([reg, ags]) => {
        setRegistry(reg);
        setAgents(ags);
        setLoaded(true);
      });
    }, []);

    useKeypress((key) => {
      if (key.ctrl && key.name === 'c') {
        process.exit(0);
      } else if (key.name === 'escape') {
        if (showBack) {
          done('back');
        } else {
          process.exit(0);
        }
      } else if (isUpKey(key)) {
        setCursor(cursor > 0 ? cursor - 1 : actions.length - 1);
      } else if (isDownKey(key)) {
        setCursor(cursor < actions.length - 1 ? cursor + 1 : 0);
      } else if (isEnterKey(key)) {
        const actionLabel = actions[cursor];
        if (actionLabel.startsWith('←')) {
          done('back');
        } else if (actionLabel.startsWith('Link')) {
          done('link');
        } else if (actionLabel.startsWith('Unlink')) {
          done('unlink');
        }
      }
    });

    const sourceLabel = getSourceLabel(skill, source);

    let output = `${prefix} ${chalk.bold(meta.name)}\n\n`;
    if (meta.description) output += `  ${meta.description}\n\n`;
    output += `  ${chalk.gray('Source:')}   ${sourceLabel}\n`;
    output += `  ${chalk.gray('Path:')}     ${skill.path}\n`;
    if (meta.version) output += `  ${chalk.gray('Version:')}  ${meta.version}\n`;
    if (meta.author) output += `  ${chalk.gray('Author:')}   ${meta.author}\n`;
    if (meta.tags?.length) output += `  ${chalk.gray('Tags:')}     ${meta.tags.join(', ')}\n`;

    // Linked projects (only after data loaded)
    if (loaded && registry) {
      const entry = registry.skills[meta.name];
      if (entry && entry.links.length > 0) {
        const agentIconMap = new Map<string, string>();
        for (const a of agents) {
          agentIconMap.set(a.config.name, a.config.icon || '');
        }
        output += `\n  ${chalk.gray('Linked:')}\n`;
        for (const link of entry.links) {
          const icon = agentIconMap.get(link.agent) || '';
          const iconStr = icon ? `${icon} ` : '';
          const projectLabel = link.projectPath === '__global__' ? 'global' : link.projectPath;
          output += `    → ${projectLabel} ${chalk.cyan(`(${iconStr}${link.agent})`)}\n`;
        }
      }
    }

    // Actions
    output += `\n  ${chalk.gray('Actions:')}\n`;
    for (let i = 0; i < actions.length; i++) {
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(actions[i]) : actions[i];
      output += `  ${icon}${label}\n`;
    }

    const hints = showBack ? '↑↓ navigate  ↵ select  esc back' : '↑↓ navigate  ↵ select  esc exit';
    output += `\n  ${chalk.gray(hints)}`;

    return output;
  },
);
