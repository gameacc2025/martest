const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modules = [
  ['auth', 'auth.routes.js', '/auth'],
  ['users', 'user.routes.js', '/users'],
  ['addresses', 'address.routes.js', '/addresses'],
  ['roles', 'role.routes.js', '/roles'],
  ['permissions', 'permission.routes.js', '/permissions'],
  ['admin', 'admin.routes.js', '/admin'],
  ['settings', 'settings.routes.js', '/settings'],
  ['companies', 'company.routes.js', '/companies'],
  ['categories', 'category.routes.js', '/categories'],
  ['products', 'product.routes.js', '/products'],
  ['specification-library', 'specification-library.routes.js', '/specification-library'],
  ['inquiries', 'inquiry.routes.js', '/inquiries'],
  ['notifications', 'notification.routes.js', '/settings/notifications'],
];

const inventoryPath = path.join(__dirname, '../../../docs/API_ROUTE_INVENTORY.md');
const inventory = fs.readFileSync(inventoryPath, 'utf8');

test('API route inventory documents every registered module route', () => {
  const missing = [];

  for (const [moduleName, routeFile, prefix] of modules) {
    const sourcePath = path.join(__dirname, '../modules', moduleName, routeFile);
    const source = fs.readFileSync(sourcePath, 'utf8');
    const routePattern = /(?:fastify|authenticated)\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g;
    let match;

    while ((match = routePattern.exec(source)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[3];
      const fullPath = `/api/v1${prefix}${routePath === '/' ? '' : routePath}`;
      const row = `| ${method} | \`${fullPath}\` |`;
      if (!inventory.includes(row)) missing.push(`${method} ${fullPath}`);
    }
  }

  assert.deepEqual(missing, [], `Undocumented API routes: ${missing.join(', ')}`);
});
