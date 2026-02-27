"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OcSwitcher } from "./oc-switcher";
import { CommandPalette } from "./command-palette";

interface TopBarProps {
  currentOc: { id: string; slug: string; name: string; plan_number: string };
  ocs: { id: string; slug: string; name: string; plan_number: string }[];
}

export function TopBar({ currentOc, ocs }: TopBarProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
      <OcSwitcher currentOc={currentOc} ocs={ocs} />
      <Button
        variant="outline"
        className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 md:w-96"
        onClick={() => setCommandOpen(true)}
      >
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <span>Search OC, lot, owner, invoice...</span>
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandPalette
        ocSlug={currentOc.slug}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </header>
  );
}
