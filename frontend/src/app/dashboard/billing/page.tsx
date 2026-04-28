import { PricingSection } from "@/components/pricing-section";
import { BillingStatus } from "@/components/billing-status";

export default function BillingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and view usage
        </p>
      </div>
      <BillingStatus />
      <div className="mt-12">
        <PricingSection />
      </div>
    </div>
  );
}
