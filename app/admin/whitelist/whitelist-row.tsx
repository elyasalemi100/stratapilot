"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removeEmailWhitelist } from "@/lib/actions/admin-actions";

interface WhitelistRowProps {
  id: string;
  pattern: string;
  patternType: string;
}

export function WhitelistRow({ id, pattern, patternType }: WhitelistRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">{pattern}</p>
        <p className="text-sm text-muted-foreground">{patternType}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          await removeEmailWhitelist(id);
          window.location.reload();
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
