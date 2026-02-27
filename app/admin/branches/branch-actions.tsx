"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Ban, PlayCircle, PauseCircle } from "lucide-react";
import { updateBranchStatus } from "@/lib/actions/admin-actions";

interface BranchActionsProps {
  branchId: string;
  currentStatus: "active" | "suspended" | "banned";
}

export function BranchActions({ branchId, currentStatus }: BranchActionsProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "ban" | "reactivate" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (action === "suspend") {
        await updateBranchStatus(branchId, "suspended", reason);
      } else if (action === "ban") {
        await updateBranchStatus(branchId, "banned", reason);
      } else if (action === "reactivate") {
        await updateBranchStatus(branchId, "active");
      }
      setOpen(false);
      setAction(null);
      setReason("");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await updateBranchStatus(branchId, "active");
      setOpen(false);
      setAction(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === "active" && (
            <DropdownMenuItem
              onClick={() => {
                setAction("suspend");
                setOpen(true);
              }}
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              Suspend
            </DropdownMenuItem>
          )}
          {(currentStatus === "suspended" || currentStatus === "banned") && (
            <DropdownMenuItem
              onClick={() => {
                setAction("reactivate");
                setOpen(true);
              }}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Reactivate
            </DropdownMenuItem>
          )}
          {currentStatus === "active" && (
            <DropdownMenuItem
              onClick={() => {
                setAction("ban");
                setOpen(true);
              }}
              className="text-destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "suspend" && "Suspend Branch"}
              {action === "ban" && "Ban Branch"}
              {action === "reactivate" && "Reactivate Branch"}
            </DialogTitle>
            <DialogDescription>
              {action === "suspend" &&
                "Suspended branches cannot access the platform. Users will be blocked."}
              {action === "ban" &&
                "Banned branches are permanently blocked. Use suspend for temporary restrictions."}
              {action === "reactivate" &&
                "Reactivating will restore access for this branch."}
            </DialogDescription>
          </DialogHeader>
          {(action === "suspend" || action === "ban") && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Payment overdue"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {action === "reactivate" ? (
              <Button onClick={handleReactivate} disabled={loading}>
                {loading ? "Reactivating..." : "Reactivate"}
              </Button>
            ) : (
              <Button
                onClick={handleAction}
                disabled={loading}
                variant={action === "ban" ? "destructive" : "default"}
              >
                {loading ? "Processing..." : action === "suspend" ? "Suspend" : "Ban"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
