"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Receipt,
  Landmark,
  Calendar,
  Mail,
  FileText,
  Home,
  Users,
  Building2,
} from "lucide-react";

interface CommandPaletteProps {
  ocSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickActions = [
  { title: "New levy run", href: "levies/runs/new", icon: Receipt },
  { title: "Import bank CSV", href: "banking/import", icon: Landmark },
  { title: "Schedule meeting", href: "meetings/new", icon: Calendar },
  { title: "Send arrears reminder", href: "levies/arrears", icon: Mail },
];

export function CommandPalette({ ocSlug, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search OC, lot, owner, invoice or run command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              onSelect={() =>
                run(() => router.push(`/${ocSlug}/${action.href}`))
              }
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
