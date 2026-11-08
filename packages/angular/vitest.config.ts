import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@clourora/sdk': fileURLToPath(new URL('../sdk/src/index.ts', import.meta.url)) } },
  test: { environment: 'jsdom', setupFiles: ['test/setup.ts'] }
});
