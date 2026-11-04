// =============================================================
// Pagination Utilities
//
// Standardizes pagination across all list endpoints.
// Query params: ?page=1&limit=20
// Response shape: { data: [...], meta: { total, page, limit, totalPages } }
// =============================================================

/**
 * Parse pagination query params and return Prisma-compatible skip/take.
 * @param {object} query - Fastify request.query
 * @returns {{ page, limit, skip, take }}
 */
function getPaginationParams(query) {
  const parsedPage = parseInt(query.page, 10);
  const page = Math.max(Number.isFinite(parsedPage) ? parsedPage : 1, 1);

  const parsedLimit = parseInt(query.limit, 10);
  const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1), 100); // cap at 100

  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

/**
 * Wrap a data array with pagination metadata.
 * @param {Array} data
 * @param {number} total - total count from DB
 * @param {number} page
 * @param {number} limit
 * @returns {{ data, meta }}
 */
function buildPaginatedResponse(data, total, page, limit) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getPaginationParams, buildPaginatedResponse };
