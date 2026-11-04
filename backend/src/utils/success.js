/**
 * Standard success response envelope.
 * @param {*} data - The payload to wrap.
 * @returns {{ data: * }}
 */
function success(data) {
  return { data };
}

/**
 * Standard paginated success response envelope.
 * @param {Array} data - The items array.
 * @param {{ page: number, limit: number, total: number, totalPages: number }} meta
 * @returns {{ data: Array, meta: object }}
 */
function paginated(data, meta) {
  return { data, meta };
}

module.exports = { success, paginated };
