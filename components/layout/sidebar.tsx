"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav-config";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  ocSlug: string;
  ocName: string;
  badges?: {
    arrearsCount?: number;
    unreconciledCount?: number;
    draftLevyRuns?: number;
  };
}

export function Sidebar({ ocSlug, ocName, badges = {} }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const getBadgeValue = (badge: string | number | undefined): number | null => {
    if (typeof badge === "number") return badge;
    if (badge === "count") return badges.arrearsCount ?? null;
    if (badge === "unreconciled") return badges.unreconciledCount ?? null;
    if (badge === "drafts") return badges.draftLevyRuns ?? null;
    return null;
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="font-semibold text-primary">
          StrataPilot
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.title);
          return (
            <div key={group.title} className="mb-2">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50"
              >
                {group.title}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-[-90deg]")}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const href = `/${ocSlug}/${item.href}`;
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    const badgeVal = getBadgeValue(item.badge);
                    return (
                      <Link
                        key={item.href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          isActive
                            ? "border-l-2 border-primary bg-primary/5 font-medium text-primary"
                            : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.title}</span>
                        {badgeVal != null && badgeVal > 0 && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {badgeVal}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
