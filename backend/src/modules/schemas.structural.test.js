// مسیر فایل: backend/src/modules/schemas.structural.test.js
// =============================================================
// Structural sanity tests — every *.schemas.js file in every module.
//
// Run with:  node --test
//
// Like openapi-route-docs.test.js, these are not business-logic
// tests (that would need a live route + real payloads, which the
// route-integration tests above already cover for the modules that
// have one). This file exists to catch the specific failure mode of
// hand-written JSON Schema: a `required` field that doesn't actually
// exist in `properties` (a schema that's impossible to satisfy, or
// worse, permits the field silently through additionalProperties
// leniency while pretending to require it), and schemas that don't
// compile with ajv at all — which would otherwise only surface when
// Fastify boots the specific route using that exact schema object
// (already covered indirectly for wired-up schemas by app.test.js,
// but this catches it directly, by name, for every exported schema,
// including any not yet wired into a route).
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const modulesDir = __dirname;
const schemaFiles = fs.readdirSync(modulesDir, { recursive: true })
  .filter((f) => f.endsWith('.schemas.js'))
  .map((f) => path.join(modulesDir, f));

assert.ok(schemaFiles.length > 0, 'expected to find at least one *.schemas.js file — did the module layout change?');

function walkSchemas(value, path_ = '$', found = []) {
  if (!value || typeof value !== 'object') return found;
  if (value.type === 'object' && (value.properties || value.required)) {
    found.push({ path: path_, schema: value });
  }
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === 'object') walkSchemas(child, `${path_}.${key}`, found);
  }
  return found;
}

for (const filePath of schemaFiles) {
  const relPath = path.relative(modulesDir, filePath);
  const moduleExports = require(filePath);

  const isEmptyByDesign = Object.keys(moduleExports).length === 0;

  test(`${relPath}: exports at least one schema (or is an intentionally-empty deprecated stub)`, () => {
    // admin.schemas.js is a deliberately-emptied stub kept for backward
    // compatibility (see its file header) — anything else exporting
    // nothing is more likely an accidental empty file.
    if (isEmptyByDesign) {
      assert.match(fs.readFileSync(filePath, 'utf8'), /no longer needed|deprecated/i,
        `${relPath} exports nothing and doesn't look like an intentional stub`);
    } else {
      assert.ok(Object.keys(moduleExports).length > 0);
    }
  });

  for (const [exportName, schema] of Object.entries(moduleExports)) {
    if (!schema || typeof schema !== 'object') continue;

    test(`${relPath} → ${exportName}: compiles as a valid JSON Schema (ajv)`, () => {
      const ajv = new Ajv({ strict: false, allErrors: true });
      addFormats(ajv);
      assert.doesNotThrow(() => ajv.compile(schema), `ajv failed to compile ${relPath} → ${exportName}`);
    });

    test(`${relPath} → ${exportName}: every 'required' field is actually declared in 'properties' at the same level (recursively, including nested objects)`, () => {
      const nested = walkSchemas(schema);
      for (const { path: nestedPath, schema: objectSchema } of nested) {
        if (!Array.isArray(objectSchema.required)) continue;
        const declaredProps = Object.keys(objectSchema.properties || {});
        for (const requiredField of objectSchema.required) {
          assert.ok(
            declaredProps.includes(requiredField),
            `${relPath} → ${exportName}${nestedPath === '$' ? '' : ` (${nestedPath})`}: ` +
            `required field "${requiredField}" is not declared in properties (declared: [${declaredProps.join(', ')}])`
          );
        }
      }
    });

    test(`${relPath} → ${exportName}: every enum property has at least one allowed value`, () => {
      const nested = walkSchemas(schema);
      for (const { schema: objectSchema } of nested) {
        for (const [propName, propSchema] of Object.entries(objectSchema.properties || {})) {
          if (propSchema && Array.isArray(propSchema.enum)) {
            assert.ok(propSchema.enum.length > 0, `${relPath} → ${exportName}.${propName}: enum must not be empty`);
          }
        }
      }
    });
  }
}
