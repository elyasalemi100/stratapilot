import { redirect } from "next/navigation";

export default function PricingPage() {
  // Pricing disabled - redirect to login
  redirect("/login");
}
