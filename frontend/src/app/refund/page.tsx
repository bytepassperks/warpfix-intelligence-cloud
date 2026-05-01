import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Understand WarpFix's refund and cancellation policies for paid subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-warpfix.png" alt="WarpFix" width={28} height={28} />
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">WarpFix</span>
          </Link>
          <Link
            href="/"
            className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Refund Policy</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-10">Last updated: April 28, 2026</p>

        <div className="prose-legal">
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">1. Free Trial</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              WarpFix offers a Free tier that allows you to evaluate the Service at no cost, with up to 3 repairs per month and 1 connected repository. We encourage all users to start with the Free tier before upgrading to a paid plan. No credit card is required for the Free tier.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">2. Cancellation</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-3">
              You may cancel your paid subscription at any time through your account settings or by contacting us at <a href="mailto:support@warpfix.org" className="text-[var(--brand)] hover:underline">support@warpfix.org</a>.
            </p>
            <ul className="list-disc pl-6 text-[14px] leading-relaxed text-[var(--text-secondary)] space-y-1">
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will continue to have access to paid features until the end of the billing period</li>
              <li>After the billing period ends, your account will revert to the Free tier</li>
              <li>No partial refunds are issued for unused time within a billing period</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">3. Refund Eligibility</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-3">
              We offer refunds under the following circumstances:
            </p>

            <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">3.1 Within 14 Days of First Purchase</h3>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-4">
              If you are a first-time subscriber and are unsatisfied with the Service, you may request a full refund within 14 days of your initial subscription purchase. This applies to first-time purchases only and is a one-time courtesy.
            </p>

            <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">3.2 Service Outage</h3>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-4">
              If the Service experiences a significant outage (defined as more than 72 consecutive hours of downtime in a billing period), you may request a pro-rated credit for the affected period. Credits will be applied to your next billing cycle.
            </p>

            <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">3.3 Billing Errors</h3>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              If you were charged incorrectly due to a billing error on our part, we will issue a full refund for the erroneous charge within 5 business days of notification.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">4. Non-Refundable Situations</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-3">
              Refunds are generally not provided in the following cases:
            </p>
            <ul className="list-disc pl-6 text-[14px] leading-relaxed text-[var(--text-secondary)] space-y-1">
              <li>After 14 days from the initial purchase (for new subscribers)</li>
              <li>For subscription renewals (monthly or annual)</li>
              <li>If your account was terminated for violation of our Terms of Service or Acceptable Use Policy</li>
              <li>For differences in expectations regarding the Service&apos;s AI-generated patches or code reviews</li>
              <li>For partial months or unused portions of a billing period after voluntary cancellation</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">5. Annual Subscriptions</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Annual subscriptions receive a discounted rate. If you cancel an annual subscription after the 14-day refund window, you will retain access until the end of the annual period, but no prorated refund will be issued. In exceptional circumstances (e.g., extended service disruption), we may consider partial credits at our discretion.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">6. How to Request a Refund</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mb-3">
              To request a refund, please contact our support team:
            </p>
            <ul className="list-disc pl-6 text-[14px] leading-relaxed text-[var(--text-secondary)] space-y-1 mb-4">
              <li>Email <a href="mailto:support@warpfix.org" className="text-[var(--brand)] hover:underline">support@warpfix.org</a> with the subject line &quot;Refund Request&quot;</li>
              <li>Include your account email address and the reason for your refund request</li>
              <li>Include the transaction ID or invoice number if available</li>
            </ul>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              We aim to process all refund requests within 5&ndash;10 business days. Approved refunds will be credited to the original payment method.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">7. Promotional Credits and Promo Codes</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Promotional credits, discounts applied via promo codes, and any free trial periods are non-refundable and have no cash value. If you received a discounted subscription through a promo code, any refund will be calculated based on the amount actually paid, not the original list price.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">8. Contact Us</h2>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
              For any questions regarding refunds or billing, please contact us at:
            </p>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] mt-2">
              <strong>Email:</strong> <a href="mailto:support@warpfix.org" className="text-[var(--brand)] hover:underline">support@warpfix.org</a><br />
              <strong>Website:</strong> <a href="https://warpfix.org" className="text-[var(--brand)] hover:underline">warpfix.org</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--text-tertiary)]">
          <span>&copy; {new Date().getFullYear()} WarpFix. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-[var(--text-secondary)] transition-colors">Cookies</Link>
            <Link href="/refund" className="hover:text-[var(--text-secondary)] transition-colors">Refund</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
