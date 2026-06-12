import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/index.ts'],
  format: ['esm'],
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  onSuccess: async () => {
    // Add shebang to CLI entry
    const cliPath = path.resolve('dist/cli/index.js');
    const content = fs.readFileSync(cliPath, 'utf-8');
    if (!content.startsWith('#!')) {
      fs.writeFileSync(cliPath, '#!/usr/bin/env node\n' + content);
    }
  },
});
