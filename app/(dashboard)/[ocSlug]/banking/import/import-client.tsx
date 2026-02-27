"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { importBankTransactions, type CsvColumnMapping } from "@/lib/actions/banking-actions";
import { FileSpreadsheet } from "lucide-react";

interface ImportClientProps {
  bankAccounts: { id: string; name: string }[];
}

export function BankingImportClient({ bankAccounts }: ImportClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [mapping, setMapping] = useState<CsvColumnMapping>({
    date: "",
    description: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as Record<string, string>[];
        setRows(data);
        setHeaders(data[0] ? Object.keys(data[0]) : []);
        setMapping({
          date: data[0] ? Object.keys(data[0])[0] ?? "" : "",
          description: data[0] ? Object.keys(data[0])[1] ?? "" : "",
          amount: data[0] ? Object.keys(data[0])[2] ?? "" : "",
        });
      },
    });
  }, []);

  const handleImport = async () => {
    if (!file || rows.length === 0 || !bankAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await importBankTransactions(bankAccountId, rows, mapping);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import Bank Statement</h1>
        <p className="text-muted-foreground">
          Upload a CSV file from your bank to import transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Account</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>CSV File</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm"
                  />
                  {file && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSpreadsheet className="h-4 w-4" />
                      {file.name} ({rows.length} rows)
                    </span>
                  )}
                </div>
              </div>
              {headers.length > 0 && (
                <div className="space-y-4 rounded-lg border p-4">
                  <Label>Map columns</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Date</Label>
                      <select
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={mapping.date}
                        onChange={(e) => setMapping((p) => ({ ...p, date: e.target.value }))}
                      >
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <select
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={mapping.description}
                        onChange={(e) => setMapping((p) => ({ ...p, description: e.target.value }))}
                      >
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Amount (or Debit/Credit)</Label>
                      <select
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={mapping.amount}
                        onChange={(e) => setMapping((p) => ({ ...p, amount: e.target.value }))}
                      >
                        <option value="">—</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {result && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
                  Imported {result.imported} of {result.total} transactions (duplicates skipped)
                </div>
              )}
              <Button
                onClick={handleImport}
                disabled={loading || rows.length === 0}
              >
                {loading ? "Importing..." : "Import"}
              </Button>
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
