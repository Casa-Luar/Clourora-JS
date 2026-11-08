// npm run version:set -- 0.2.0
// Sets the same version on every package and the matching @clourora/sdk range in the packages that depend on it
// (angular as a peer, elements as a dependency). The packages always move together; see RELEASING.md.
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  console.error('Usage: npm run version:set -- <x.y.z | x.y.z-beta.n>');
  process.exit(1);
}

for (const name of ['sdk', 'angular', 'elements']) {
  const file = new URL(`../packages/${name}/package.json`, import.meta.url);
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  const before = pkg.version;
  pkg.version = version;
  for (const field of ['dependencies', 'peerDependencies']) {
    if (pkg[field]?.['@clourora/sdk']) pkg[field]['@clourora/sdk'] = `^${version}`;
  }
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`@clourora/${name}: ${before} → ${version}`);
}
console.log('\nNext: npm install (refreshes package-lock.json), then npm run release:check');
