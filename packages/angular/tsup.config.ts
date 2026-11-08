import { defineConfig } from 'tsup';

// Plain ESM, no decorators: only InjectionToken, inject() and resource(), so no Angular compiler (ng-packagr) is needed
// and one build works for every Angular version in peerDependencies.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  sourcemap: true,
  external: [/^@angular\//, /^@clourora\//, /^rxjs/]
});
