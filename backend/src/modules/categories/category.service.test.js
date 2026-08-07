// مسیر فایل: backend/src/modules/categories/category.service.test.js
// =============================================================
// Unit tests — Category service (categories, subcategories, and
// the category->products listing used by the public site)
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const serviceDir = __dirname;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(serviceDir, relativePath));
  const original = require.cache[resolved];
  require.cache[resolved] = new Module(resolved);
  require.cache[resolved].exports = exportsObj;
  require.cache[resolved].loaded = true;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
  return resolved;
}

const calls = {
  categoryFindMany: [],
  categoryFindUnique: [],
  categoryCreate: [],
  categoryUpdate: [],
  categoryDelete: [],
  subcategoryFindMany: [],
  subcategoryFindUnique: [],
  subcategoryCreate: [],
  subcategoryUpdate: [],
  subcategoryDelete: [],
  productCount: [],
  productFindMany: [],
};
let fx;
function resetMocks() {
  Object.keys(calls).forEach((k) => (calls[k] = []));
  fx = {
    categories: [],
    category: null,
    subcategories: [],
    subcategory: null,
    productCount: 0,
    products: [],
    created: { id: 1 },
    updated: { id: 1 },
  };
}
resetMocks();

const mockPrisma = {
  category: {
    findMany: async (args) => {
      calls.categoryFindMany.push(args);
      return fx.categories;
    },
    findUnique: async (args) => {
      calls.categoryFindUnique.push(args);
      return fx.category;
    },
    create: async (args) => {
      calls.categoryCreate.push(args);
      return fx.created;
    },
    update: async (args) => {
      calls.categoryUpdate.push(args);
      return fx.updated;
    },
    delete: async (args) => {
      calls.categoryDelete.push(args);
      return {};
    },
  },
  subcategory: {
    findMany: async (args) => {
      calls.subcategoryFindMany.push(args);
      return fx.subcategories;
    },
    findUnique: async (args) => {
      calls.subcategoryFindUnique.push(args);
      return fx.subcategory;
    },
    create: async (args) => {
      calls.subcategoryCreate.push(args);
      return fx.created;
    },
    update: async (args) => {
      calls.subcategoryUpdate.push(args);
      return fx.updated;
    },
    delete: async (args) => {
      calls.subcategoryDelete.push(args);
      return {};
    },
  },
  product: {
    count: async (args) => {
      calls.productCount.push(args);
      return fx.productCount;
    },
    findMany: async (args) => {
      calls.productFindMany.push(args);
      return fx.products;
    },
  },
};

injectMock('../../config/db', mockPrisma);

const {
  listCategories,
  getCategoryById,
  listSubcategoriesByCategory,
  getSubcategoryById,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('./category.service');

// ── listCategories ───────────────────────────────────────────

test('listCategories: activeOnly=true filters both categories and nested subcategories by status ACTIVE', async () => {
  resetMocks();
  await listCategories({ activeOnly: true });

  const args = calls.categoryFindMany[0];
  assert.deepEqual(args.where, { status: 'ACTIVE' });
  assert.deepEqual(args.include.subcategories.where, { status: 'ACTIVE' });
});

test('listCategories: without activeOnly, no status filter is applied at either level', async () => {
  resetMocks();
  await listCategories();

  const args = calls.categoryFindMany[0];
  assert.deepEqual(args.where, {});
  assert.equal(args.include.subcategories.where, undefined);
});

test('listCategories: orders by sortOrder asc at both levels', async () => {
  resetMocks();
  await listCategories();

  assert.deepEqual(calls.categoryFindMany[0].orderBy, { sortOrder: 'asc' });
  assert.deepEqual(calls.categoryFindMany[0].include.subcategories.orderBy, { sortOrder: 'asc' });
});

// ── getCategoryById ──────────────────────────────────────────

test('getCategoryById: coerces a string id to a number', async () => {
  resetMocks();
  await getCategoryById('42');
  assert.equal(calls.categoryFindUnique[0].where.id, 42);
});

// ── listSubcategoriesByCategory ──────────────────────────────

test('listSubcategoriesByCategory: scopes to the given categoryId', async () => {
  resetMocks();
  await listSubcategoriesByCategory('7');
  assert.deepEqual(calls.subcategoryFindMany[0].where, { categoryId: 7 });
});

test('listSubcategoriesByCategory: activeOnly=true adds a status filter', async () => {
  resetMocks();
  await listSubcategoriesByCategory(7, { activeOnly: true });
  assert.deepEqual(calls.subcategoryFindMany[0].where, { categoryId: 7, status: 'ACTIVE' });
});

// ── getSubcategoryById ───────────────────────────────────────

test('getSubcategoryById: includes the parent category and ordered specification fields', async () => {
  resetMocks();
  await getSubcategoryById('3');

  const args = calls.subcategoryFindUnique[0];
  assert.equal(args.where.id, 3);
  assert.ok(args.include.category);
  assert.deepEqual(
    args.include.specificationTemplate.include.fields.orderBy,
    { sortOrder: 'asc' }
  );
});

// ── createCategory / updateCategory / deleteCategory ─────────

test('createCategory: passes the data through as-is', async () => {
  resetMocks();
  const data = { nameFa: 'موبایل', slug: 'mobile' };
  await createCategory(data);
  assert.deepEqual(calls.categoryCreate[0].data, data);
});

test('updateCategory: coerces id and updates', async () => {
  resetMocks();
  await updateCategory('5', { nameFa: 'جدید' });
  assert.equal(calls.categoryUpdate[0].where.id, 5);
  assert.deepEqual(calls.categoryUpdate[0].data, { nameFa: 'جدید' });
});

test('deleteCategory: refuses to delete a category that still has products', async () => {
  resetMocks();
  fx.productCount = 3;

  await assert.rejects(() => deleteCategory(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.categoryDelete.length, 0);
});

test('deleteCategory: deletes an empty category', async () => {
  resetMocks();
  fx.productCount = 0;

  await deleteCategory(1);
  assert.equal(calls.categoryDelete.length, 1);
});

// ── createSubcategory / updateSubcategory / deleteSubcategory ─

test('createSubcategory: coerces categoryId to a number', async () => {
  resetMocks();
  await createSubcategory({ nameFa: 'زیردسته', categoryId: '9' });
  assert.equal(calls.subcategoryCreate[0].data.categoryId, 9);
});

test('updateSubcategory: coerces both id and categoryId (when present) to numbers', async () => {
  resetMocks();
  await updateSubcategory('4', { categoryId: '9', nameFa: 'X' });

  assert.equal(calls.subcategoryUpdate[0].where.id, 4);
  assert.equal(calls.subcategoryUpdate[0].data.categoryId, 9);
});

test('updateSubcategory: leaves categoryId untouched when not present in the update payload', async () => {
  resetMocks();
  await updateSubcategory('4', { nameFa: 'X' });
  assert.equal('categoryId' in calls.subcategoryUpdate[0].data, false);
});

test('deleteSubcategory: refuses to delete a subcategory that still has products', async () => {
  resetMocks();
  fx.productCount = 1;

  await assert.rejects(() => deleteSubcategory(1), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
  assert.equal(calls.subcategoryDelete.length, 0);
});

// ── getCategoryProducts ──────────────────────────────────────

test('getCategoryProducts: scopes by categoryId and excludes soft-deleted products', async () => {
  resetMocks();
  await getCategoryProducts('5', { skip: 0, take: 20 });

  assert.deepEqual(calls.productFindMany[0].where, { categoryId: 5, deletedAt: null });
});

test('getCategoryProducts: publishedOnly=true additionally clamps to PUBLISHED + PUBLIC', async () => {
  resetMocks();
  await getCategoryProducts('5', { skip: 0, take: 20, publishedOnly: true });

  assert.deepEqual(calls.productFindMany[0].where, {
    categoryId: 5,
    deletedAt: null,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
  });
});

test('getCategoryProducts: returns { items, total }', async () => {
  resetMocks();
  fx.products = [{ id: 1 }];
  fx.productCount = 1;

  const result = await getCategoryProducts('5', { skip: 0, take: 20 });
  assert.deepEqual(result, { items: fx.products, total: 1 });
});