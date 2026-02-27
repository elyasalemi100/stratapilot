"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendArrearsReminder } from "@/lib/actions/levy-actions";

interface ArrearsClientProps {
  invoiceId: string;
}

export function ArrearsClient({ invoiceId }: ArrearsClientProps) {
  const [loading, setLoading] = useState(false);

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      await sendArrearsReminder(invoiceId);
      alert("Reminder sent");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendReminder}
      disabled={loading}
    >
      {loading ? "Sending..." : "Send reminder"}
    </Button>
  );
}
