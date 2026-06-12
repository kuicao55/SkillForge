import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgent } from '../core/agent/manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('loadAgent', () => {
  it('should load a valid agent config', async () => {
    const configPath = path.join(fixturesDir, 'agents', 'test-agent.yaml');
    const agent = await loadAgent(configPath);

    expect(agent).not.toBeNull();
    expect(agent!.config.name).toBe('test-agent');
    expect(agent!.config.type).toBe('test-type');
    expect(agent!.config.paths.project).toBe('.test');
    expect(agent!.config.paths.global).toBe('~/.test');
    expect(agent!.config.paths.skills).toBe('skills');
    expect(agent!.config.load_order).toEqual(['project', 'global']);
  });

  it('should return null for non-existent file', async () => {
    const agent = await loadAgent('/nonexistent/agent.yaml');
    expect(agent).toBeNull();
  });
});
