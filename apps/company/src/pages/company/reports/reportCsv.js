/**
 * Escape a CSV cell and neutralize spreadsheet formula injection.
 * Quoting alone is insufficient: spreadsheet applications may evaluate
 * cells beginning with =, +, - or @ even when the value is quoted.
 */
export function formatCsvCell(value) {
  let text = String(value ?? '')
  if (/^[\\s\\uFEFF]*[=+\\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
