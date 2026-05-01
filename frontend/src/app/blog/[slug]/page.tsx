import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | WarpFix Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.isoDate,
      authors: [post.author],
      siteName: "WarpFix",
      url: `https://warpfix.org/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://warpfix.org/blog/${post.slug}`,
    },
  };
}

function renderMarkdown(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-2xl font-bold text-[var(--text-primary)] mt-10 mb-4"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="text-xl font-semibold text-[var(--text-primary)] mt-8 mb-3"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={key++}
          className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-[13px] leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.startsWith("| ")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("| ")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headerCells = tableLines[0]
        .split("|")
        .filter(Boolean)
        .map((c) => c.trim());
      const dataRows = tableLines.slice(2);
      elements.push(
        <div key={key++} className="overflow-x-auto my-6">
          <table className="w-full text-[14px] border border-[var(--border-default)] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                {headerCells.map((cell, ci) => (
                  <th
                    key={ci}
                    className="px-4 py-2.5 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-default)]"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => {
                const cells = row
                  .split("|")
                  .filter(Boolean)
                  .map((c) => c.trim());
                return (
                  <tr key={ri} className="border-b border-[var(--border-default)] last:border-0">
                    {cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-4 py-2.5 text-[var(--text-secondary)]"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith("- **") || line.startsWith("1. **")) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || /^\d+\. /.test(lines[i]))
      ) {
        listItems.push(lines[i]);
        i++;
      }
      const isOrdered = listItems[0]?.match(/^\d+\./);
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag
          key={key++}
          className={`my-4 space-y-2 ${isOrdered ? "list-decimal" : "list-disc"} pl-6`}
        >
          {listItems.map((item, li) => {
            const text = item.replace(/^[-\d]+\.?\s*/, "");
            return (
              <li
                key={li}
                className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: text
                    .replace(
                      /\*\*(.+?)\*\*/g,
                      '<strong class="text-[var(--text-primary)]">$1</strong>'
                    )
                    .replace(
                      /`(.+?)`/g,
                      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>'
                    ),
                }}
              />
            );
          })}
        </Tag>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    elements.push(
      <p
        key={key++}
        className="text-[15px] text-[var(--text-secondary)] leading-[1.8] my-4"
        dangerouslySetInnerHTML={{
          __html: line
            .replace(
              /\*\*(.+?)\*\*/g,
              '<strong class="text-[var(--text-primary)]">$1</strong>'
            )
            .replace(
              /`(.+?)`/g,
              '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>'
            )
            .replace(
              /\[(.+?)\]\((.+?)\)/g,
              '<a href="$2" class="text-indigo-600 hover:underline">$1</a>'
            ),
        }}
      />
    );
    i++;
  }

  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.isoDate,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "WarpFix",
      url: "https://warpfix.org",
    },
    mainEntityOfPage: `https://warpfix.org/blog/${post.slug}`,
    keywords: post.keywords.join(", "),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${post.title.toLowerCase()} about?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: post.excerpt,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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
            href="/blog"
            className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            All Posts
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${post.categoryColor}`}
            >
              {post.category}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {post.date}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">·</span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {post.readTime}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-[14px]">
                W
              </span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                {post.author}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                {post.authorRole}
              </p>
            </div>
          </div>
        </header>

        <div className="prose-warpfix">{renderMarkdown(post.content)}</div>

        <footer className="mt-16 pt-8 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-[14px] text-indigo-600 hover:underline"
            >
              Back to all posts
            </Link>
            <Link
              href="https://api.warpfix.org/auth/github"
              className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-hover)] transition-all"
            >
              Try WarpFix Free
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
