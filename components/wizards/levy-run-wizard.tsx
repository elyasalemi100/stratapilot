"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createLevyRun,
  generateInvoicesForLevyRun,
  approveLevyRun,
  sendLevyNotices,
} from "@/lib/actions/levy-actions";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LevyRunWizardProps {
  ocId: string;
  ocSlug: string;
  funds: { id: string; name: string; fund_type: string }[];
}

export function LevyRunWizard({ ocId, ocSlug, funds }: LevyRunWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levyRunId, setLevyRunId] = useState<string | null>(null);
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number } | null>(null);

  const [formData, setFormData] = useState({
    fundId: funds[0]?.id ?? "",
    periodStart: "",
    periodEnd: "",
    dueDate: "",
    totalAmount: 0,
  });

  const handleStep1 = async () => {
    setLoading(true);
    setError(null);
    try {
      const run = await createLevyRun(ocId, {
        fundId: formData.fundId,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        dueDate: formData.dueDate,
        totalAmount: formData.totalAmount,
      });
      setLevyRunId(run.id);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!levyRunId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateInvoicesForLevyRun(levyRunId);
      setInvoiceCount(result.count);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!levyRunId) return;
    setLoading(true);
    setError(null);
    try {
      await approveLevyRun(levyRunId);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    if (!levyRunId) return;
    setLoading(true);
    setError(null);
    try {
      const results = await sendLevyNotices(levyRunId);
      const success = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      setSendResults({ success, failed });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push(`/${ocSlug}/levies/runs`);
    router.refresh();
  };

  const steps = ["Levy Details", "Generate Invoices", "Approve", "Send Notices", "Complete"];

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              i === step ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Fund</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.fundId}
                  onChange={(e) => setFormData((p) => ({ ...p, fundId: e.target.value }))}
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData((p) => ({ ...p, periodStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData((p) => ({ ...p, periodEnd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.totalAmount || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, totalAmount: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Generate invoices for each lot based on unit entitlements. The total amount of{" "}
                {formatCurrency(formData.totalAmount)} will be split proportionally.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                {invoiceCount ?? 0} invoices have been generated. Approve the levy run to mark
                invoices as issued.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Send levy notices via email with PDF attachments to all owners with email addresses.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm text-muted-foreground">
                Levy run complete! {sendResults?.success ?? 0} notices sent.
                {sendResults && sendResults.failed > 0 && (
                  <span className="text-destructive"> {sendResults.failed} failed (missing email).</span>
                )}
              </p>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step === 0 && (
              <Button onClick={handleStep1} disabled={loading || !formData.fundId || !formData.periodStart || !formData.periodEnd || !formData.dueDate || formData.totalAmount <= 0}>
                {loading ? "Creating..." : "Create Levy Run"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 1 && (
              <Button onClick={handleStep2} disabled={loading}>
                {loading ? "Generating..." : "Generate Invoices"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleStep3} disabled={loading}>
                {loading ? "Approving..." : "Approve & Publish"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleStep4} disabled={loading}>
                {loading ? "Sending..." : "Send Notices"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 4 && <Button onClick={handleComplete}>Done</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
