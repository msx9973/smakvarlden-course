import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type CsvRow = Record<string, string>;

function parseCSV(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(Boolean).map((l) => {
    const vals = parseRow(l);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
  return { headers, rows };
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  expectedHeaders: string[];
  example: string;
  onImport: (rows: CsvRow[]) => Promise<void>;
}

export function ImportDialog({ open, onClose, title, expectedHeaders, example, onImport }: ImportDialogProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "preview" | "importing" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: h, rows: r } = parseCSV(e.target?.result as string);
      setHeaders(h);
      setRows(r);
      setStatus("preview");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function doImport() {
    setStatus("importing");
    try {
      await onImport(rows);
      setMsg(`${rows.length} ${t("rader importerade")}`);
      setStatus("done");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : t("Fel vid import"));
      setStatus("error");
    }
  }

  function reset() {
    setRows([]); setHeaders([]); setFileName(""); setStatus("idle"); setMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">{title}</DialogTitle>
        </DialogHeader>

        {status === "idle" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--sv-border)", background: "var(--sv-muted)" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--sv-text-2)" }} />
              <p className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{t("Dra CSV-fil hit eller klicka")}</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t("UTF-8, kommaseparerad")}</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--sv-gold)" }}>
                {t("Exempelformat")}
              </p>
              <code className="text-[12px] block whitespace-pre" style={{ color: "var(--sv-text-2)", fontFamily: "monospace" }}>
                {expectedHeaders.join(",")}{"\n"}{example}
              </code>
            </div>
          </div>
        )}

        {(status === "preview" || status === "importing") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
              <span className="text-[13px]" style={{ color: "var(--sv-text)" }}>{fileName}</span>
              <span className="text-[12px] ml-auto" style={{ color: "var(--sv-text-2)" }}>{rows.length} {t("rader")}</span>
            </div>
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--sv-border)" }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ background: "var(--sv-muted)" }}>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--sv-text-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--sv-border)" }}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2" style={{ color: "var(--sv-text)" }}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="px-3 py-2 text-[12px]" style={{ color: "var(--sv-text-2)" }}>
                  ...{t("och")} {rows.length - 5} {t("rader till")}
                </p>
              )}
            </div>
          </div>
        )}

        {(status === "done" || status === "error") && (
          <div className="flex flex-col items-center gap-3 py-8">
            {status === "done"
              ? <CheckCircle2 className="w-10 h-10" style={{ color: "#16a34a" }} />
              : <AlertCircle className="w-10 h-10" style={{ color: "#dc2626" }} />}
            <p className="text-[14px] font-semibold" style={{ color: "var(--sv-text)" }}>{msg}</p>
          </div>
        )}

        <DialogFooter>
          {status === "idle" && <Button variant="outline" onClick={handleClose}>{t("Avbryt")}</Button>}
          {status === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>{t("Byt fil")}</Button>
              <Button onClick={doImport}>{t("Importera")} {rows.length} {t("rader")}</Button>
            </>
          )}
          {status === "importing" && <Button disabled>{t("Importerar...")}</Button>}
          {(status === "done" || status === "error") && <Button onClick={handleClose}>{t("Stäng")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
