export interface CsvColumnMapping {
  date: string;
  description: string;
  amount: string;
  debit?: string;
  credit?: string;
  balance?: string;
}

export function parseAmount(
  row: Record<string, string>,
  mapping: CsvColumnMapping
): { amount: number; type: "debit" | "credit" } {
  if (mapping.amount && mapping.amount.trim()) {
    const val =
      parseFloat(String(row[mapping.amount] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
    return { amount: Math.abs(val), type: val >= 0 ? "credit" : "debit" };
  }
  const debit =
    parseFloat(String(row[mapping.debit ?? ""] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
  const credit =
    parseFloat(String(row[mapping.credit ?? ""] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
  if (credit > 0) return { amount: credit, type: "credit" };
  return { amount: debit, type: "debit" };
}

export function parseDate(val: string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
