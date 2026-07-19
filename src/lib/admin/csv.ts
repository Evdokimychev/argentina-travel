/** Protects exported cells both from malformed CSV and spreadsheet formula execution. */
export function escapeCsvCell(value: string): string {
  const protectedValue = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(protectedValue)) {
    return `"${protectedValue.replace(/"/g, '""')}"`;
  }
  return protectedValue;
}
