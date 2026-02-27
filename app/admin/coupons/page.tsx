import {
  getCouponCodes,
  createCouponCode,
  deleteCouponCode,
} from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Tag } from "lucide-react";
import { CouponForm } from "./coupon-form";
import { CouponRow } from "./coupon-row";

export default async function AdminCouponsPage() {
  const coupons = await getCouponCodes();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Coupon Codes</h1>
        <p className="text-muted-foreground">
          Create discount codes for subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Create Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <p className="text-muted-foreground">No coupon codes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Code</th>
                    <th className="text-left py-3">Type</th>
                    <th className="text-left py-3">Value</th>
                    <th className="text-left py-3">Redemptions</th>
                    <th className="text-left py-3">Valid Until</th>
                    <th className="text-right py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <CouponRow key={c.id} coupon={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
