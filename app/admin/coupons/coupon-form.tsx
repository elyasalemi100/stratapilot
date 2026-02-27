"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCouponCode } from "@/lib/actions/admin-actions";

export function CouponForm() {
  const [code, setCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "fixed" | "trial_days">("percent");
  const [value, setValue] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;
    setLoading(true);
    try {
      await createCouponCode({
        code: code.trim(),
        coupon_type: couponType,
        value: parseFloat(value) || 0,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
        valid_until: validUntil || undefined,
      });
      setCode("");
      setValue("");
      setMaxRedemptions("");
      setValidUntil("");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="SAVE20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            value={couponType}
            onChange={(e) => setCouponType(e.target.value as "percent" | "fixed" | "trial_days")}
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount</option>
            <option value="trial_days">Trial days</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Value {couponType === "percent" ? "(%)" : couponType === "fixed" ? "($)" : "(days)"}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={couponType === "percent" ? "20" : couponType === "fixed" ? "50" : "30"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Max Redemptions (optional)</Label>
          <Input
            type="number"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Valid Until (optional)</Label>
        <Input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Coupon"}
      </Button>
    </form>
  );
}
