/** "2026-11-20 14:32:00" (UTC, do SQLite) -> "20/11/2026" no fuso do aparelho. */
export function formatarData(sqlUtc: string): string {
  const d = new Date(sqlUtc.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return sqlUtc;
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}
