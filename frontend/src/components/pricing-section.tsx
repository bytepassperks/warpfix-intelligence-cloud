import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "0",
    currency: "",
    period: "",
    description: "Get started with basic CI repair",
    features: [
      "3 repairs per month",
      "Basic error classification",
      "Fingerprint matching",
      "Single repository",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "999",
    currency: "INR",
    period: "/month",
    description: "Unlimited repairs for serious developers",
    features: [
      "Unlimited repairs",
      "Advanced LLM classification",
      "Full sandbox validation",
      "Dependency radar alerts",
      "Unlimited repositories",
      "Priority support",
      "Repair analytics dashboard",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "2,999",
    currency: "INR",
    period: "/month",
    description: "Org-level shared repair intelligence",
    features: [
      "Everything in Pro",
      "Org-wide shared fingerprints",
      "Team repair memory",
      "Org stability scoring",
      "Admin dashboard",
      "SSO support",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground text-lg">Start free. Scale as you grow.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`p-6 rounded-xl border ${
              plan.highlighted
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card"
            }`}
          >
            {plan.highlighted && (
              <div className="text-xs font-medium text-primary mb-4">Most Popular</div>
            )}
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              {plan.currency && <span className="text-sm text-muted-foreground">{plan.currency}</span>}
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
            <Link
              href="/api/auth/github"
              className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {plan.cta}
            </Link>
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-1 h-1 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
