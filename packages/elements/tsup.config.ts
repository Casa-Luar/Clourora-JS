import { defineConfig } from 'tsup';

export default defineConfig([
  // npm: import '@clourora/elements' (the SDK stays a shared dependency)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'es2022',
    sourcemap: true,
    external: [/^@clourora\//]
  },
  // CDN: one <script> with the SDK inside, defines the elements on load
  {
    entry: { 'clourora-elements': 'src/index.ts' },
    format: ['iife'],
    globalName: 'ClouroraElements',
    outExtension: () => ({ js: '.js' }),
    minify: true,
    target: 'es2020',
    sourcemap: true,
    noExternal: [/^@clourora\//]
  }
]);
