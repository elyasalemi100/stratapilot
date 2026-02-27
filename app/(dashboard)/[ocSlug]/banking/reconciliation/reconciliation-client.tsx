"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { matchTransactionToInvoice } from "@/lib/actions/banking-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link2 } from "lucide-react";

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  lot?: { lot_number: string; unit_address?: string } | { lot_number: string; unit_address?: string }[];
}

interface ReconciliationClientProps {
  ocSlug: string;
  bankAccounts: { id: string; name: string }[];
  transactions: Transaction[];
  invoices: Invoice[];
}

export function ReconciliationClient({
  ocSlug,
  transactions,
  invoices,
}: ReconciliationClientProps) {
  const [matching, setMatching] = useState<{ txnId: string; invId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async (txnId: string, invId: string, amount: number) => {
    setMatching({ txnId, invId });
    setError(null);
    try {
      await matchTransactionToInvoice(txnId, invId, amount);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
    } finally {
      setMatching(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reconciliation</h1>
        <p className="text-muted-foreground">
          Match bank transactions to invoices
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unreconciled Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">
              {transactions.length} transactions to match
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No unreconciled transactions. Import a bank statement first.
                </p>
              ) : (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{txn.description || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.transaction_date)} •{" "}
                        {txn.transaction_type === "credit" ? "+" : "-"}
                        {formatCurrency(txn.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unpaid / Partially Paid Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">
              {invoices.length} invoices available to match
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No unmatched invoices.
                </p>
              ) : (
                invoices.map((inv) => {
                  const due = Number(inv.total_amount) - Number(inv.amount_paid ?? 0);
                  return (
                    <div
                      key={inv.id}
                      className="rounded-lg border p-3"
                    >
                      <p className="font-medium">
                        {inv.invoice_number} • Lot {Array.isArray(inv.lot) ? inv.lot[0]?.lot_number : (inv.lot as { lot_number: string })?.lot_number ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(inv.due_date)} • Amount due: {formatCurrency(due)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {transactions
                          .filter(
                            (t) =>
                              t.transaction_type === "credit" &&
                              Math.abs(Number(t.amount) - due) < 0.02
                          )
                          .slice(0, 5)
                          .map((txn) => (
                            <Button
                              key={txn.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatch(txn.id, inv.id, txn.amount)}
                              disabled={!!matching}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Match {formatCurrency(txn.amount)}
                            </Button>
                          ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
