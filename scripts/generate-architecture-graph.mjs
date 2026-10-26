import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const graphPath = path.join(root, 'docs/architecture/DEPENDENCY_GRAPH.generated.mmd');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const listDirs = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const apps = listDirs('apps').map((dir) => ({ dir, pkg: readJson(path.join(root, 'apps', dir, 'package.json')) }));
const packages = listDirs('packages').map((dir) => ({ dir, pkg: readJson(path.join(root, 'packages', dir, 'package.json')) }));
const appSource = fs.readFileSync(path.join(root, 'backend/src/app.js'), 'utf8');
const modulesDir = path.join(root, 'backend/src/modules');
const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(modulesDir, entry.name, entry.name === 'specification-library' ? 'specification-library.routes.js' : entry.name.replace(/s$/, '') + '.routes.js')))
  .map((entry) => entry.name)
  .filter((name) => appSource.includes(`./modules/${name}/`))
  .sort();
const id = (name) => name.replace(/^@telecom\//, '').replace(/[^a-zA-Z0-9_]/g, '_');
const label = (name) => name.replace(/^@telecom\//, '');
const lines = [
  '%% GENERATED FILE. Do not edit by hand.',
  '%% Run: node scripts/generate-architecture-graph.mjs --write',
  'flowchart LR',
  '  subgraph apps["Frontend applications"]',
];
for (const { dir, pkg } of apps) lines.push(`    ${id(pkg.name)}["${pkg.name}<br/>${dir}"]`);
lines.push('  end', '  subgraph shared["Shared workspace packages"]');
for (const { pkg } of packages) lines.push(`    ${id(pkg.name)}["${label(pkg.name)}"]`);
lines.push('  end', '  subgraph backend["Backend"]', '    api["Fastify API<br/>/api/v1"]', '  end', '  db[("PostgreSQL<br/>Prisma schema + migrations")]');
for (const { pkg } of [...apps, ...packages]) {
  const owner = id(pkg.name);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const dep of Object.keys(deps).filter((name) => name.startsWith('@telecom/')).sort()) {
    if (packages.some((item) => item.pkg.name === dep)) lines.push(`  ${owner} --> ${id(dep)}`);
  }
}
for (const { pkg } of apps) lines.push(`  ${id(pkg.name)} -->|HTTP /api/v1| api`);
lines.push('  api --> auth["Auth / RBAC middleware"]');
for (const moduleName of modules) lines.push(`  api --> mod_${id(moduleName)}["${moduleName} module"]`);
lines.push('  auth --> db');
for (const moduleName of modules) lines.push(`  mod_${id(moduleName)} --> db`);
lines.push('  db --- migrations["backend/prisma/migrations/*"]', '');

const output = lines.join('\n');
const mode = process.argv[2] || '--stdout';
if (mode === '--stdout') process.stdout.write(output);
else if (mode === '--write') {
  fs.mkdirSync(path.dirname(graphPath), { recursive: true });
  fs.writeFileSync(graphPath, output);
  process.stdout.write(`Wrote ${path.relative(root, graphPath)}\n`);
} else if (mode === '--check') {
  if (!fs.existsSync(graphPath) || fs.readFileSync(graphPath, 'utf8') !== output) {
    console.error('Architecture graph is stale. Run: node scripts/generate-architecture-graph.mjs --write');
    process.exitCode = 1;
  } else process.stdout.write('Architecture graph is current.\n');
} else {
  console.error('Usage: node scripts/generate-architecture-graph.mjs [--stdout|--write|--check]');
  process.exitCode = 2;
}
