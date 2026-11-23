/**
 * Load a complete paginated report from the management API.
 *
 * The API caps page size at 100. A report must never silently present or
 * export only the first page as if it were the full company dataset.
 * If the dataset changes while pages are being fetched, fail visibly rather
 * than return a partial or internally inconsistent report.
 */
function normalizePage(response) {
  const root = response?.data ?? response;
  const payload = root?.data ?? root;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(root?.items)
        ? root.items
        : null;
  const meta = payload?.meta ?? root?.meta ?? response?.meta ?? null;

  if (!items || !meta) {
    throw new Error('ساختار صفحه‌بندی گزارش محصولات معتبر نیست.');
  }

  return { items, meta };
}

export async function fetchAllPages(fetchPage, pageSize = 100) {
  if (typeof fetchPage !== 'function') throw new TypeError('fetchPage must be a function');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('pageSize must be an integer between 1 and 100');
  }

  const first = normalizePage(await fetchPage(1, pageSize));
  const total = Number(first.meta.total);
  const totalPages = Number(first.meta.totalPages);
  const reportedLimit = Number(first.meta.limit);
  const reportedPage = Number(first.meta.page);

  if (
    !Number.isInteger(total) || total < 0
    || !Number.isInteger(totalPages) || totalPages < 0
    || !Number.isInteger(reportedLimit) || reportedLimit < 1
    || reportedLimit > 100
    || reportedPage !== 1
    || totalPages !== Math.ceil(total / reportedLimit)
    || first.items.length > reportedLimit
  ) {
    throw new Error('فراداده صفحه‌بندی گزارش محصولات معتبر نیست.');
  }

  const items = [...first.items];
  for (let page = 2; page <= totalPages; page += 1) {
    const current = normalizePage(await fetchPage(page, pageSize));
    const currentTotal = Number(current.meta.total);
    const currentPages = Number(current.meta.totalPages);
    const currentLimit = Number(current.meta.limit);
    const currentPage = Number(current.meta.page);

    if (
      currentTotal !== total
      || currentPages !== totalPages
      || currentLimit !== reportedLimit
      || currentPage !== page
      || current.items.length > reportedLimit
    ) {
      throw new Error('داده‌های گزارش هنگام دریافت تغییر کرده‌اند؛ لطفاً دوباره تلاش کنید.');
    }
    items.push(...current.items);
  }

  if (items.length !== total) {
    throw new Error('دریافت گزارش کامل نشد؛ تعداد رکوردهای دریافتی با تعداد کل مطابقت ندارد.');
  }

  return items;
}
