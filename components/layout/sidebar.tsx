"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav-config";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  ocSlug: string;
  ocName: string;
  isSuperAdmin?: boolean;
  badges?: {
    arrearsCount?: number;
    unreconciledCount?: number;
    draftLevyRuns?: number;
  };
}

export function Sidebar({ ocSlug, ocName, isSuperAdmin = false, badges = {} }: SidebarProps) {
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
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      <div className="flex h-14 items-center border-b border-slate-700/80 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white transition-opacity hover:opacity-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm">
            S
          </span>
          StrataPilot
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.title);
          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-slate-500 transition-transform", isCollapsed && "rotate-[-90deg]")}
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
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative",
                          isActive
                            ? "bg-slate-800/90 text-white border-r-2 border-cyan-400"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                        <span className="flex-1 truncate">{item.title}</span>
                        {badgeVal != null && badgeVal > 0 && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                            {badgeVal}
                          </span>
                        )}
                        <ChevronRight className={cn("h-4 w-4 shrink-0", isActive ? "text-cyan-400" : "text-slate-500")} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isSuperAdmin && (
        <div className="border-t border-slate-700/80 p-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            <Shield className="h-4 w-4" />
            Platform Admin
          </Link>
        </div>
      )}
    </aside>
  );
}
