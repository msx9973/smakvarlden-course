export type CsvRow = Record<string, string>;

/**
 * RFC 4180-ish CSV parser that keeps newlines and commas inside quoted fields.
 * Escaped quotes use the standard "" sequence.
 */
export function parseCSV(text: string): { headers: string[]; rows: CsvRow[] } {
  const input = text.replace(/^\uFEFF/, "");
  if (!input.trim()) return { headers: [], rows: [] };

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field.trim());
      field = "";
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    if (ch === "\n") {
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  if (rows.length < 2) return { headers: [], rows: [] };

  const headers = rows[0];
  const dataRows = rows.slice(1).map((vals) =>
    Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""])),
  );
  return { headers, rows: dataRows };
}
