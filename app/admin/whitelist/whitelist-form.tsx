"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addEmailWhitelist } from "@/lib/actions/admin-actions";

export function WhitelistForm() {
  const [pattern, setPattern] = useState("");
  const [patternType, setPatternType] = useState<"domain" | "exact">("domain");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;
    setLoading(true);
    try {
      await addEmailWhitelist(pattern.trim(), patternType);
      setPattern("");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="flex gap-4 items-end">
      <div className="flex-1 space-y-2">
        <Label>Pattern</Label>
        <Input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="@company.com or user@example.com"
        />
      </div>
      <div className="w-32 space-y-2">
        <Label>Type</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={patternType}
          onChange={(e) => setPatternType(e.target.value as "domain" | "exact")}
        >
          <option value="domain">Domain</option>
          <option value="exact">Exact</option>
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}
