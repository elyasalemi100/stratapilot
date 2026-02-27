"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Building2, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OcOption {
  id: string;
  slug: string;
  name: string;
  plan_number: string;
}

interface OcSwitcherProps {
  currentOc: OcOption;
  ocs: OcOption[];
  className?: string;
}

export function OcSwitcher({ currentOc, ocs, className }: OcSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredOcs = search
    ? ocs.filter(
        (oc) =>
          oc.name.toLowerCase().includes(search.toLowerCase()) ||
          oc.plan_number.toLowerCase().includes(search.toLowerCase())
      )
    : ocs;

  const handleSelect = (oc: OcOption) => {
    setOpen(false);
    router.push(`/${oc.slug}/dashboard`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[200px] justify-between font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentOc.name}</span>
            <span className="text-muted-foreground">({currentOc.plan_number})</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search OCs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredOcs.map((oc) => (
            <DropdownMenuItem
              key={oc.id}
              onClick={() => handleSelect(oc)}
              className={cn(
                "cursor-pointer",
                oc.id === currentOc.id && "bg-accent"
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{oc.name}</span>
                <span className="text-xs text-muted-foreground">{oc.plan_number}</span>
              </div>
            </DropdownMenuItem>
          ))}
          {filteredOcs.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No OCs found
            </div>
          )}
        </div>
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push("/portfolio");
          }}
          className="cursor-pointer border-t"
        >
          View all OCs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
