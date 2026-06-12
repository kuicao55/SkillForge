import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSkillMd } from '../core/skill/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('parseSkillMd', () => {
  it('should parse a valid SKILL.md', async () => {
    const skillMdPath = path.join(fixturesDir, 'valid-skill', 'SKILL.md');
    const skill = await parseSkillMd(skillMdPath);

    expect(skill).not.toBeNull();
    expect(skill!.metadata.name).toBe('test-skill');
    expect(skill!.metadata.description).toBe('A test skill');
    expect(skill!.metadata.version).toBe('1.0.0');
    expect(skill!.metadata.author).toBe('test-author');
    expect(skill!.metadata.tags).toEqual(['test', 'example']);
  });

  it('should return null for non-existent file', async () => {
    const skill = await parseSkillMd('/nonexistent/SKILL.md');
    expect(skill).toBeNull();
  });

  it('should parse SKILL.md with minimal frontmatter', async () => {
    const skillMdPath = path.join(fixturesDir, 'minimal-skill', 'SKILL.md');
    const skill = await parseSkillMd(skillMdPath);

    expect(skill).not.toBeNull();
    expect(skill!.metadata.name).toBe('minimal-skill');
    expect(skill!.metadata.description).toBeUndefined();
  });
});
