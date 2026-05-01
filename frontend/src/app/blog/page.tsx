import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical insights, architecture deep-dives, and product updates from the WarpFix engineering team.",
};

const POSTS = [
  {
    slug: "fingerprint-based-ci-repair",
    title: "How Fingerprint-Based CI Repair Works",
    excerpt: "Deep dive into how WarpFix normalizes, hashes, and matches error patterns to deliver instant fixes for recurring CI failures — and why this approach beats naive LLM prompting.",
    date: "April 25, 2026",
    readTime: "8 min read",
    category: "Architecture",
    categoryColor: "bg-indigo-50 text-indigo-700",
  },
  {
    slug: "multi-agent-architecture",
    title: "Our Multi-Agent Pipeline Explained",
    excerpt: "WarpFix uses six specialized agents — parser, classifier, patcher, validator, scorer, and shipper — working in sequence. Here's why we chose this architecture over a single monolithic LLM call.",
    date: "April 18, 2026",
    readTime: "12 min read",
    category: "Engineering",
    categoryColor: "bg-blue-50 text-blue-700",
  },
  {
    slug: "warpfix-vs-manual-debugging",
    title: "WarpFix vs. Manual CI Debugging: A Time Comparison",
    excerpt: "We measured repair times across 500 real CI failures. Manual debugging averaged 23 minutes per failure. WarpFix averaged 47 seconds. Here's the full breakdown by failure type.",
    date: "April 10, 2026",
    readTime: "6 min read",
    category: "Benchmarks",
    categoryColor: "bg-green-50 text-green-700",
  },
  {
    slug: "sandbox-validation-deep-dive",
    title: "Why Every Patch Runs in a Sandbox Before Reaching Your Code",
    excerpt: "Generating a patch is easy. Knowing it actually works is hard. Here's how WarpFix's sandbox validation pipeline catches bad patches before they ever reach your repository.",
    date: "April 3, 2026",
    readTime: "7 min read",
    category: "Security",
    categoryColor: "bg-orange-50 text-orange-700",
  },
  {
    slug: "building-trust-in-ai-code-changes",
    title: "Building Trust in AI-Generated Code Changes",
    excerpt: "Trust is earned, not assumed. We discuss our approach to transparency, confidence scoring, human review gates, and why WarpFix never auto-merges without approval.",
    date: "March 28, 2026",
    readTime: "9 min read",
    category: "Product",
    categoryColor: "bg-purple-50 text-purple-700",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-warpfix.png" alt="WarpFix" width={28} height={28} />
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">WarpFix</span>
          </Link>
          <Link href="/" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Blog</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-12">
          Technical insights and product updates from the WarpFix engineering team.
        </p>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-xl border border-[var(--border-default)] p-6 hover:border-indigo-200 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${post.categoryColor}`}>
                  {post.category}
                </span>
                <span className="text-[12px] text-[var(--text-tertiary)]">{post.date}</span>
                <span className="text-[12px] text-[var(--text-tertiary)]">·</span>
                <span className="text-[12px] text-[var(--text-tertiary)]">{post.readTime}</span>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-indigo-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[14px] text-[var(--text-tertiary)]">
            Subscribe to our engineering blog — <a href="mailto:support@warpfix.org" className="text-indigo-600 hover:underline">support@warpfix.org</a>
          </p>
        </div>
      </main>
    </div>
  );
}
