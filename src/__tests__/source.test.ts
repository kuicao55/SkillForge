import { describe, it, expect } from 'vitest';
import { isGitUrl, parseSource, parseSkillOptions, toPackageName } from '../core/skill/source.js';

describe('isGitUrl', () => {
  it.each([
    'https://github.com/twostraws/swiftui-agent-skill',
    'https://github.com/twostraws/swiftui-agent-skill.git',
    'http://gitlab.com/owner/repo',
    'ssh://git@github.com/owner/repo.git',
    'git://github.com/owner/repo.git',
    'git@github.com:twostraws/swiftui-agent-skill.git',
    'owner/repo.git',
  ])('treats %s as a Git URL', (input) => {
    expect(isGitUrl(input)).toBe(true);
  });

  it.each([
    'lovstudio/md2pdf',
    'vercel-labs/agent-skills',
    'notion',
    '@scope/name',
  ])('treats %s as a registry name', (input) => {
    expect(isGitUrl(input)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isGitUrl('')).toBe(false);
    expect(isGitUrl('   ')).toBe(false);
  });
});

describe('parseSource', () => {
  it('returns a URL source unchanged', () => {
    expect(parseSource('https://github.com/twostraws/swiftui-agent-skill')).toEqual({
      kind: 'url',
      value: 'https://github.com/twostraws/swiftui-agent-skill',
    });
  });

  it('returns a registry source unchanged', () => {
    expect(parseSource('lovstudio/md2pdf')).toEqual({
      kind: 'registry',
      value: 'lovstudio/md2pdf',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseSource('  lovstudio/md2pdf  ')).toEqual({
      kind: 'registry',
      value: 'lovstudio/md2pdf',
    });
  });

  it('throws on an empty source', () => {
    expect(() => parseSource('   ')).toThrow('Source cannot be empty');
  });
});

describe('toPackageName', () => {
  it('keeps registry names as-is', () => {
    expect(toPackageName({ kind: 'registry', value: 'lovstudio/md2pdf' })).toBe('lovstudio/md2pdf');
  });

  it.each([
    'https://github.com/twostraws/swiftui-agent-skill',
    'https://github.com/twostraws/swiftui-agent-skill.git',
    'https://github.com/twostraws/swiftui-agent-skill/',
    'git@github.com:twostraws/swiftui-agent-skill.git',
    'ssh://git@github.com/twostraws/swiftui-agent-skill.git',
    'git://github.com/twostraws/swiftui-agent-skill.git',
    'twostraws/swiftui-agent-skill.git',
  ])('normalizes %s to owner/repo', (url) => {
    expect(toPackageName({ kind: 'url', value: url })).toBe('twostraws/swiftui-agent-skill');
  });

  it('keeps non-GitHub URLs as-is', () => {
    expect(toPackageName({ kind: 'url', value: 'https://gitlab.com/owner/repo' })).toBe(
      'https://gitlab.com/owner/repo',
    );
  });

  it('keeps GitHub URLs pointing at a subdirectory as-is', () => {
    const url = 'https://github.com/owner/repo/tree/main/skills/foo';
    expect(toPackageName({ kind: 'url', value: url })).toBe(url);
  });
});

describe('parseSkillOptions', () => {
  it('returns an empty list when no option is given', () => {
    expect(parseSkillOptions()).toEqual([]);
    expect(parseSkillOptions([])).toEqual([]);
  });

  it('keeps a single skill name', () => {
    expect(parseSkillOptions(['swiftui-pro'])).toEqual(['swiftui-pro']);
  });

  it('supports repeated --skill values', () => {
    expect(parseSkillOptions(['foo', 'bar'])).toEqual(['foo', 'bar']);
  });

  it('splits comma-separated values', () => {
    expect(parseSkillOptions(['foo,bar,baz'])).toEqual(['foo', 'bar', 'baz']);
  });

  it('splits, trims, and drops empty parts', () => {
    expect(parseSkillOptions([' foo , ,bar ', 'baz,,'])).toEqual(['foo', 'bar', 'baz']);
  });

  it('deduplicates while preserving order', () => {
    expect(parseSkillOptions(['foo,bar', 'bar', 'foo'])).toEqual(['foo', 'bar']);
  });
});
