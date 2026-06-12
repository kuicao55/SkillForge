import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { RegistrySchema } from '../types/registry.js';

describe('Registry Schema', () => {
  it('should validate a valid registry', () => {
    const registry = {
      version: 1,
      skills: {
        'test-skill': {
          name: 'test-skill',
          source: 'community',
          installPath: '/path/to/skill',
          installedAt: new Date().toISOString(),
          links: [],
        },
      },
    };

    const result = RegistrySchema.safeParse(registry);
    expect(result.success).toBe(true);
  });

  it('should validate a registry with links', () => {
    const registry = {
      version: 1,
      skills: {
        'test-skill': {
          name: 'test-skill',
          source: 'personal',
          installPath: '/path/to/skill',
          installedAt: new Date().toISOString(),
          links: [
            {
              agent: 'claude',
              projectPath: '/path/to/project',
              symlinkPath: '/path/to/symlink',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    };

    const result = RegistrySchema.safeParse(registry);
    expect(result.success).toBe(true);
  });

  it('should reject invalid source', () => {
    const registry = {
      version: 1,
      skills: {
        'test-skill': {
          name: 'test-skill',
          source: 'invalid',
          installPath: '/path/to/skill',
          installedAt: new Date().toISOString(),
          links: [],
        },
      },
    };

    const result = RegistrySchema.safeParse(registry);
    expect(result.success).toBe(false);
  });
});
