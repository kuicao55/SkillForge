import { createPrompt, useState, useKeypress, isEnterKey, isUpKey, isDownKey, usePrefix, useEffect } from '@inquirer/core';
import chalk from 'chalk';
import { findAllTags, findSkillsByTag } from '../../core/skill/discovery.js';
import { loadRegistry } from '../../core/registry/manager.js';

interface TagInfo {
  tag: string;
  count: number;
  projects: string[];
}

export const tagBrowser = createPrompt<string, { message: string }>(
  (config, done) => {
    const [tags, setTags] = useState<TagInfo[]>([]);
    const [cursor, setCursor] = useState(0);
    const [loading, setLoading] = useState(true);
    const prefix = usePrefix({});

    useEffect(() => {
      Promise.all([findAllTags(), loadRegistry()]).then(([tagMap, registry]) => {
        const result: TagInfo[] = [];
        for (const [tag, count] of tagMap) {
          // Collect all projects linked by skills with this tag
          const projectSet = new Set<string>();
          const skills = findSkillsByTag(tag); // returns Promise, but we need sync...
          // We'll resolve this below
          result.push({ tag, count, projects: [] });
        }
        // Now resolve linked projects for each tag
        const sorted = result.sort((a, b) => a.tag.localeCompare(b.tag));
        setTags(sorted);
        setLoading(false);

        // Async: load linked projects for each tag
        Promise.all(sorted.map(async (info) => {
          const items = await findSkillsByTag(info.tag);
          const projects = new Set<string>();
          for (const item of items) {
            const entry = registry.skills[item.skill.metadata.name];
            if (entry) {
              for (const link of entry.links) {
                const proj = link.projectPath === '__global__' ? 'global' : link.projectPath;
                // Show just the folder name, not full path
                const name = proj === 'global' ? 'global' : proj.split('/').pop() || proj;
                projects.add(name);
              }
            }
          }
          info.projects = Array.from(projects).sort();
        })).then(() => {
          // Trigger re-render by setting tags again
          setTags([...sorted]);
        });
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
        done(tags[cursor].tag);
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
      const { tag, count, projects } = tags[i];
      const isSelected = i === cursor;
      const icon = isSelected ? chalk.cyan('❯ ') : '  ';
      const label = isSelected ? chalk.cyan.bold(tag) : tag;
      const countStr = chalk.gray(`(${count} skill${count !== 1 ? 's' : ''})`);
      const projStr = projects.length > 0 ? ` ${chalk.green('→')} ${chalk.gray(projects.join(', '))}` : '';
      output += `  ${icon}${chalk.magenta('●')} ${label} ${countStr}${projStr}\n`;
    }
    output += `\n  ${chalk.gray('↑↓ navigate  ↵ select  esc exit')}`;
    return output;
  },
);
