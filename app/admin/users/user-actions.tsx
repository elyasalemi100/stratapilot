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
import { updateUserStatus } from "@/lib/actions/admin-actions";

interface UserActionsProps {
  userId: string;
  currentStatus: "active" | "suspended" | "banned";
}

export function UserActions({ userId, currentStatus }: UserActionsProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "ban" | "reactivate" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (action === "reactivate") {
        await updateUserStatus(userId, "active");
      } else if (action === "suspend") {
        await updateUserStatus(userId, "suspended", reason);
      } else if (action === "ban") {
        await updateUserStatus(userId, "banned", reason);
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
            <>
              <DropdownMenuItem
                onClick={() => {
                  setAction("suspend");
                  setOpen(true);
                }}
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                Suspend
              </DropdownMenuItem>
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
            </>
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
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "suspend" && "Suspend User"}
              {action === "ban" && "Ban User"}
              {action === "reactivate" && "Reactivate User"}
            </DialogTitle>
            <DialogDescription>
              {action === "suspend" &&
                "Suspended users cannot log in. They can be reactivated later."}
              {action === "ban" &&
                "Banned users are permanently blocked. Use suspend for temporary restrictions."}
              {action === "reactivate" &&
                "Reactivating will restore access for this user."}
            </DialogDescription>
          </DialogHeader>
          {(action === "suspend" || action === "ban") && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Policy violation"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading}
              variant={action === "ban" ? "destructive" : "default"}
            >
              {loading ? "Processing..." : action === "reactivate" ? "Reactivate" : action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
