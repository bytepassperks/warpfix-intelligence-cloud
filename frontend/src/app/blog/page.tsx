import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog | WarpFix — CI Repair Intelligence",
  description:
    "Technical insights on CI failure fingerprinting, multi-agent repair architecture, sandbox validation, and developer productivity from the WarpFix engineering team.",
  keywords: [
    "CI repair blog",
    "automated CI debugging",
    "CI/CD optimization",
    "build failure analysis",
    "developer productivity",
    "AI code repair",
  ],
  openGraph: {
    title: "WarpFix Engineering Blog",
    description:
      "Technical insights on CI failure fingerprinting, multi-agent repair architecture, and developer productivity.",
    type: "website",
    url: "https://warpfix.org/blog",
    siteName: "WarpFix",
  },
  twitter: {
    card: "summary_large_image",
    title: "WarpFix Engineering Blog",
    description:
      "Technical insights on CI repair automation and developer productivity.",
  },
  alternates: {
    canonical: "https://warpfix.org/blog",
  },
};

export default function BlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "WarpFix Engineering Blog",
    description:
      "Technical insights on CI failure fingerprinting, multi-agent repair architecture, and developer productivity.",
    url: "https://warpfix.org/blog",
    publisher: {
      "@type": "Organization",
      name: "WarpFix",
      url: "https://warpfix.org",
    },
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.isoDate,
      url: `https://warpfix.org/blog/${post.slug}`,
      author: { "@type": "Organization", name: post.author },
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-warpfix.png"
              alt="WarpFix"
              width={28}
              height={28}
            />
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">
              WarpFix
            </span>
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
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Blog
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-12">
          Technical insights and product updates from the WarpFix engineering
          team.
        </p>

        <div className="space-y-6">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="bg-white rounded-xl border border-[var(--border-default)] p-6 hover:border-indigo-200 transition-colors group mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${post.categoryColor}`}
                  >
                    {post.category}
                  </span>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    {post.date}
                  </span>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    ·
                  </span>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  {post.excerpt}
                </p>
                <span className="inline-block mt-3 text-[13px] text-indigo-600 font-medium group-hover:underline">
                  Read article →
                </span>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[14px] text-[var(--text-tertiary)]">
            Subscribe to our engineering blog —{" "}
            <a
              href="mailto:support@warpfix.org"
              className="text-indigo-600 hover:underline"
            >
              support@warpfix.org
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
