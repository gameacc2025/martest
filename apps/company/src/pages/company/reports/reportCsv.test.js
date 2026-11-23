import { describe, expect, it } from 'vitest'
import { formatCsvCell } from './reportCsv.js'

describe('formatCsvCell', () => {
  it.each(['=1+1', '+SUM(A1:A2)', '-2+3', '@SUM(A1:A2)', '  =HYPERLINK("https://evil.example")'])(
    'neutralizes spreadsheet formulas: %s',
    (value) => {
      expect(formatCsvCell(value).startsWith('"\'')).toBe(true)
    },
  )

  it('quotes and escapes ordinary values containing commas, quotes and newlines', () => {
    expect(formatCsvCell('Acme, "North"\nLtd')).toBe('"Acme, ""North""\nLtd"')
  })

  it('keeps nullish values as empty quoted cells', () => {
    expect(formatCsvCell(null)).toBe('""')
    expect(formatCsvCell(undefined)).toBe('""')
  })
})
