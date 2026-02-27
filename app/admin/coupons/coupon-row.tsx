"use client";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { deleteCouponCode } from "@/lib/actions/admin-actions";

interface CouponRowProps {
  coupon: {
    id: string;
    code: string;
    coupon_type: string;
    value: number;
    max_redemptions: number | null;
    redemption_count: number;
    valid_until: string | null;
  };
}

export function CouponRow({ coupon }: CouponRowProps) {
  return (
    <tr className="border-b">
      <td className="py-3 font-medium">{coupon.code}</td>
      <td className="py-3">{coupon.coupon_type}</td>
      <td className="py-3">
        {coupon.coupon_type === "percent"
          ? `${coupon.value}%`
          : coupon.coupon_type === "fixed"
          ? `$${coupon.value}`
          : `${coupon.value} days`}
      </td>
      <td className="py-3">
        {coupon.redemption_count}
        {coupon.max_redemptions != null && ` / ${coupon.max_redemptions}`}
      </td>
      <td className="py-3 text-muted-foreground">
        {coupon.valid_until ? formatDateTime(coupon.valid_until) : "—"}
      </td>
      <td className="py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await deleteCouponCode(coupon.id);
            window.location.reload();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </td>
    </tr>
  );
}
