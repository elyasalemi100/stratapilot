"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createOcFromWizard,
  addSubdivision,
  addLots,
  addPeopleAndMemberships,
  addCommittee,
  addFinancialSetup,
} from "@/lib/actions/setup-actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  "OC Details",
  "Subdivisions",
  "Lots",
  "Owners",
  "Committee",
  "Financial Setup",
  "Confirm",
];

export function OcSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ocData, setOcData] = useState({
    name: "",
    plan_number: "",
    address: "",
    abn: "",
    gst_registered: true,
    management_start_date: "",
    management_end_date: "",
  });

  const [subdivisionData, setSubdivisionData] = useState({
    plan_number: "",
    common_property_notes: "",
  });

  const [lotsData, setLotsData] = useState<
    { lot_number: string; unit_address: string; entitlements: number; liabilities: number; parking: string; storage: string }[]
  >([{ lot_number: "", unit_address: "", entitlements: 1, liabilities: 1, parking: "", storage: "" }]);

  const [ownersData, setOwnersData] = useState<
    Record<
      string,
      { full_name: string; email: string; phone: string; mailing_address: string; share: number; primary: boolean }[]
    >
  >({});

  const [committeeData, setCommitteeData] = useState({
    term_start: "",
    term_end: "",
  });

  const [createdOcId, setCreatedOcId] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [createdLots, setCreatedLots] = useState<{ id: string; lot_number: string }[]>([]);

  const addLot = () => {
    setLotsData((prev) => [
      ...prev,
      { lot_number: "", unit_address: "", entitlements: 1, liabilities: 1, parking: "", storage: "" },
    ]);
  };

  const updateLot = (index: number, field: string, value: string | number) => {
    setLotsData((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const removeLot = (index: number) => {
    if (lotsData.length > 1) {
      setLotsData((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleStep1 = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createOcFromWizard({
        name: ocData.name,
        plan_number: ocData.plan_number,
        address: ocData.address || undefined,
        abn: ocData.abn || undefined,
        gst_registered: ocData.gst_registered,
        management_start_date: ocData.management_start_date || undefined,
        management_end_date: ocData.management_end_date || undefined,
      });
      setCreatedOcId(result.oc.id);
      setCreatedSlug(result.slug);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!createdOcId) return;
    setLoading(true);
    setError(null);
    try {
      await addSubdivision(createdOcId, {
        plan_number: subdivisionData.plan_number || ocData.plan_number,
        common_property_notes: subdivisionData.common_property_notes || undefined,
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!createdOcId) return;
    setLoading(true);
    setError(null);
    try {
      const lotsToAdd = lotsData.filter((l) => l.lot_number.trim());
      if (lotsToAdd.length === 0) throw new Error("Add at least one lot");

      await addLots(createdOcId, lotsToAdd.map((l) => ({
        lot_number: l.lot_number,
        unit_address: l.unit_address || undefined,
        entitlements: l.entitlements,
        liabilities: l.liabilities,
        parking: l.parking || undefined,
        storage: l.storage || undefined,
      })));

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("lots")
        .select("id, lot_number")
        .eq("oc_id", createdOcId)
        .is("deleted_at", null);
      setCreatedLots(data ?? []);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    if (!createdOcId) return;
    setLoading(true);
    setError(null);
    try {
      const memberships: Parameters<typeof addPeopleAndMemberships>[1] = [];
      for (const [lotId, owners] of Object.entries(ownersData)) {
        const validOwners = owners.filter((o) => o.full_name.trim());
        const totalShare = validOwners.reduce((s, o) => s + (o.share || 0), 0);
        for (const o of validOwners) {
          const share =
            totalShare > 0
              ? o.share || 0
              : validOwners.length === 1
              ? 100
              : Math.round(100 / validOwners.length);
          memberships.push({
            lot_id: lotId,
            full_name: o.full_name,
            email: o.email || undefined,
            phone: o.phone || undefined,
            mailing_address: o.mailing_address || undefined,
            ownership_share_percent: share,
            is_primary_contact: o.primary,
            role: "owner",
          });
        }
      }
      if (memberships.length > 0) {
        await addPeopleAndMemberships(createdOcId, memberships);
      }
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep5 = async () => {
    if (!createdOcId) return;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const peopleResult = await supabase
        .from("people")
        .select("id")
        .eq("oc_id", createdOcId)
        .is("deleted_at", null)
        .limit(1);
      const firstPersonId = peopleResult.data?.[0]?.id;

      if (committeeData.term_start && committeeData.term_end && firstPersonId) {
        await addCommittee(createdOcId, {
          term_start: committeeData.term_start,
          term_end: committeeData.term_end,
          members: [{ person_id: firstPersonId, position: "chair" }],
        });
      }
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep6 = async () => {
    if (!createdOcId) return;
    setLoading(true);
    setError(null);
    try {
      await addFinancialSetup(createdOcId, {
        funds: [
          { name: "Admin Fund", fund_type: "admin" },
          { name: "Capital Works Fund", fund_type: "capital_works" },
        ],
        bank_accounts: [{ name: "Main Account" }],
        chart_accounts: [
          { code: "4000", name: "Levies Income", account_type: "income" },
          { code: "5000", name: "Administration", account_type: "expense" },
          { code: "5100", name: "Insurance", account_type: "expense" },
        ],
      });
      setStep(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (createdSlug) {
      router.push(`/${createdSlug}/dashboard`);
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">OC Setup Wizard</h1>
        <p className="text-muted-foreground">Create a new Owners Corporation</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
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
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>OC Name</Label>
                  <Input
                    value={ocData.name}
                    onChange={(e) => setOcData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Sunrise Apartments"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Number</Label>
                  <Input
                    value={ocData.plan_number}
                    onChange={(e) => setOcData((p) => ({ ...p, plan_number: e.target.value }))}
                    placeholder="PS 123456"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={ocData.address}
                  onChange={(e) => setOcData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="45 Beach Road, St Kilda VIC 3182"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>ABN (optional)</Label>
                  <Input
                    value={ocData.abn}
                    onChange={(e) => setOcData((p) => ({ ...p, abn: e.target.value }))}
                    placeholder="12 345 678 901"
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="gst"
                    checked={ocData.gst_registered}
                    onChange={(e) => setOcData((p) => ({ ...p, gst_registered: e.target.checked }))}
                  />
                  <Label htmlFor="gst">GST Registered</Label>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Management Start</Label>
                  <Input
                    type="date"
                    value={ocData.management_start_date}
                    onChange={(e) => setOcData((p) => ({ ...p, management_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Management End</Label>
                  <Input
                    type="date"
                    value={ocData.management_end_date}
                    onChange={(e) => setOcData((p) => ({ ...p, management_end_date: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Plan Number</Label>
                <Input
                  value={subdivisionData.plan_number}
                  onChange={(e) => setSubdivisionData((p) => ({ ...p, plan_number: e.target.value }))}
                  placeholder={ocData.plan_number || "PS 123456"}
                />
              </div>
              <div className="space-y-2">
                <Label>Common Property Notes</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={subdivisionData.common_property_notes}
                  onChange={(e) =>
                    setSubdivisionData((p) => ({ ...p, common_property_notes: e.target.value }))
                  }
                  placeholder="Foyer, lifts, garden, pool..."
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">Define lots with entitlements and liabilities.</p>
              {lotsData.map((lot, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Lot {i + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLot(i)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Lot Number</Label>
                      <Input
                        value={lot.lot_number}
                        onChange={(e) => updateLot(i, "lot_number", e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Address</Label>
                      <Input
                        value={lot.unit_address}
                        onChange={(e) => updateLot(i, "unit_address", e.target.value)}
                        placeholder="Unit 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Entitlements</Label>
                      <Input
                        type="number"
                        min={1}
                        value={lot.entitlements}
                        onChange={(e) => updateLot(i, "entitlements", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Liabilities</Label>
                      <Input
                        type="number"
                        min={1}
                        value={lot.liabilities}
                        onChange={(e) => updateLot(i, "liabilities", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parking</Label>
                      <Input
                        value={lot.parking}
                        onChange={(e) => updateLot(i, "parking", e.target.value)}
                        placeholder="P1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Storage</Label>
                      <Input
                        value={lot.storage}
                        onChange={(e) => updateLot(i, "storage", e.target.value)}
                        placeholder="S1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLot}>
                Add Lot
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Add owners for each lot. You can add multiple owners per lot with ownership share %.
              </p>
              {createdLots.map((lot) => (
                <div key={lot.id} className="rounded-lg border p-4">
                  <p className="font-medium mb-4">Lot {lot.lot_number}</p>
                  <div className="space-y-4">
                    {((ownersData[lot.id] ?? []) as { full_name: string; email: string; phone: string; mailing_address: string; share: number; primary: boolean }[]).length === 0 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Owner name"
                          onChange={(e) => {
                            const v = e.target.value;
                            setOwnersData((p) => ({
                              ...p,
                              [lot.id]: [{ full_name: v, email: "", phone: "", mailing_address: "", share: 100, primary: true }],
                            }));
                          }}
                        />
                      </div>
                    )}
                    {(ownersData[lot.id] ?? []).map((o, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Full name"
                          value={o.full_name}
                          onChange={(e) =>
                            setOwnersData((p) => ({
                              ...p,
                              [lot.id]: (p[lot.id] ?? []).map((x, j) =>
                                j === i ? { ...x, full_name: e.target.value } : x
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={o.email}
                          onChange={(e) =>
                            setOwnersData((p) => ({
                              ...p,
                              [lot.id]: (p[lot.id] ?? []).map((x, j) =>
                                j === i ? { ...x, email: e.target.value } : x
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={o.phone}
                          onChange={(e) =>
                            setOwnersData((p) => ({
                              ...p,
                              [lot.id]: (p[lot.id] ?? []).map((x, j) =>
                                j === i ? { ...x, phone: e.target.value } : x
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Mailing address"
                          value={o.mailing_address}
                          onChange={(e) =>
                            setOwnersData((p) => ({
                              ...p,
                              [lot.id]: (p[lot.id] ?? []).map((x, j) =>
                                j === i ? { ...x, mailing_address: e.target.value } : x
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOwnersData((p) => ({
                          ...p,
                          [lot.id]: [...(p[lot.id] ?? []), { full_name: "", email: "", phone: "", mailing_address: "", share: 0, primary: false }],
                        }))
                      }
                    >
                      Add owner
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Term Start</Label>
                  <Input
                    type="date"
                    value={committeeData.term_start}
                    onChange={(e) => setCommitteeData((p) => ({ ...p, term_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Term End</Label>
                  <Input
                    type="date"
                    value={committeeData.term_end}
                    onChange={(e) => setCommitteeData((p) => ({ ...p, term_end: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Committee positions will be assigned from the owners you added. You can edit committee membership later in Settings.
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-sm text-muted-foreground">
                Default financial setup: Admin Fund, Capital Works Fund, standard chart of accounts. You can customize in Settings after setup.
              </p>
            </>
          )}

          {step === 6 && (
            <>
              <p className="text-sm text-muted-foreground">
                Setup complete! Your OC &quot;{ocData.name}&quot; has been created with subdivisions, lots, and financial structure.
              </p>
              <p className="text-sm">Generate OC Profile PDF from Documents when ready.</p>
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
            {step < 6 ? (
              <Button
                onClick={() => {
                  if (step === 0) handleStep1();
                  else if (step === 1) handleStep2();
                  else if (step === 2) handleStep3();
                  else if (step === 3) handleStep4();
                  else if (step === 4) handleStep5();
                  else if (step === 5) handleStep6();
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>Go to Dashboard</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
