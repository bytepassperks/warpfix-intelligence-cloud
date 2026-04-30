import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const BASE_URL = "https://warpfix-frontend.onrender.com";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#635bff",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "WarpFix — Autonomous CI Repair Agent | Fix CI Failures Automatically",
    template: "%s | WarpFix",
  },
  description:
    "WarpFix is an AI-powered CI repair agent that detects failures, generates safe patches, validates in sandboxes, and opens PRs automatically. Fix CI/CD pipeline errors in seconds.",
  keywords: [
    "CI repair",
    "automated CI fixes",
    "CI/CD automation",
    "GitHub Actions repair",
    "DevOps AI agent",
    "code review AI",
    "PR review automation",
    "CI failure detection",
    "automated patching",
    "sandbox validation",
    "fingerprint learning",
    "predictive CI",
    "security auto-patching",
    "dead code detection",
    "technical debt tracker",
    "dependency radar",
    "test coverage analysis",
    "CodeRabbit alternative",
    "AI code review",
    "developer tools",
  ],
  authors: [{ name: "WarpFix", url: BASE_URL }],
  creator: "WarpFix",
  publisher: "WarpFix",
  applicationName: "WarpFix",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "WarpFix",
    title: "WarpFix — Autonomous CI Repair Agent",
    description:
      "AI-powered CI repair agent that fixes pipeline failures automatically. Detect errors, generate patches, validate in sandboxes, and open PRs — all in seconds.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "WarpFix — Autonomous CI Repair Agent",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WarpFix — Autonomous CI Repair Agent",
    description:
      "Fix CI/CD pipeline failures automatically with AI. Detect, patch, validate, and ship — in seconds.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@warpfix",
    site: "@warpfix",
  },
  category: "Developer Tools",
  classification: "Software",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "WarpFix",
    "msapplication-TileColor": "#635bff",
    "msapplication-config": "/browserconfig.xml",
  },
};

function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WarpFix",
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-512.png`,
    description:
      "WarpFix is an AI-powered autonomous CI repair agent for developers.",
    sameAs: ["https://github.com/bytepassperks/warpfix-intelligence-cloud"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: `${BASE_URL}/#faq`,
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WarpFix",
    url: BASE_URL,
    description:
      "Autonomous CI repair agent that detects failures, generates patches, and opens PRs automatically.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/dashboard?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WarpFix",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description:
      "AI-powered CI repair agent. Detect CI failures, generate safe patches, validate in sandboxes, and open PRs automatically.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "3 repairs per month, error classification, fingerprint matching, 1 repository",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "12",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description:
          "Unlimited repairs, PR review intelligence, sandbox validation, predictive CI failure, security auto-patching",
      },
      {
        "@type": "Offer",
        name: "Team",
        price: "36",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description:
          "Everything in Pro plus shared fingerprints, team repair memory, tech debt tracking, SSO",
      },
    ],
    featureList: [
      "Multi-agent CI repair pipeline",
      "Fingerprint learning and caching",
      "Sandbox patch validation",
      "PR review intelligence with Mermaid diagrams",
      "Chat agent for PR comments",
      "Dependency radar monitoring",
      "Predictive CI failure prevention",
      "Security vulnerability auto-patching",
      "Dead code detection",
      "Test coverage gap analysis",
      "Technical debt tracking",
      "Quality gates via .warpfix.yaml",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does WarpFix detect CI failures?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WarpFix integrates as a GitHub App. When a workflow fails, GitHub sends a webhook and WarpFix starts analyzing the failure logs immediately.",
        },
      },
      {
        "@type": "Question",
        name: "Is my code safe with WarpFix?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WarpFix only reads logs and file contents needed for repair. All patches are validated in isolated sandboxes. The GitHub App uses minimal permissions.",
        },
      },
      {
        "@type": "Question",
        name: "What errors can WarpFix fix?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Build errors, test failures, lint issues, type errors, dependency problems, runtime crashes, and configuration bugs.",
        },
      },
      {
        "@type": "Question",
        name: "How does fingerprint learning work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Each error is normalized and hashed into a unique fingerprint. When the same pattern recurs across any repository in your org, the proven fix is reused instantly with high confidence — reducing repair time by 37%.",
        },
      },
      {
        "@type": "Question",
        name: "What if a patch has low confidence?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Patches below 40 confidence are flagged for manual review and not opened as PRs. Scores between 40-70 get a 'review suggested' label. Only high-confidence patches are auto-merged.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use WarpFix without Warp terminal?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The web dashboard and GitHub App work independently. Terminal commands are optional — you can use WarpFix entirely through the web interface.",
        },
      },
      {
        "@type": "Question",
        name: "How is WarpFix different from CodeRabbit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CodeRabbit reviews code but does not fix it. WarpFix reviews AND auto-repairs CI failures. WarpFix also includes predictive CI failure prevention, security auto-patching, dead code detection, fingerprint learning, and sandbox validation — features CodeRabbit does not offer.",
        },
      },
      {
        "@type": "Question",
        name: "What CI/CD platforms does WarpFix support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WarpFix currently supports GitHub Actions with webhook integration. Support for GitLab CI, CircleCI, and Jenkins is on the roadmap.",
        },
      },
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to set up WarpFix for your repository",
    description:
      "Get started with WarpFix in 3 steps to automatically repair CI failures.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "CI fails",
        text: "GitHub fires a webhook the moment your workflow fails. WarpFix starts analyzing within seconds.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Analyze & patch",
        text: "Logs are parsed, errors classified, fingerprints checked, and a safe patch is generated via LLM.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Validate & ship",
        text: "Patch is tested in a sandbox, scored for confidence, and a PR is opened automatically.",
      },
    ],
    totalTime: "PT30S",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: `${BASE_URL}/#features`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Pricing",
        item: `${BASE_URL}/#pricing`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "FAQ",
        item: `${BASE_URL}/#faq`,
      },
    ],
  };

  const schemas = [
    organizationSchema,
    websiteSchema,
    softwareSchema,
    faqSchema,
    howToSchema,
    breadcrumbSchema,
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://warpfix-api.onrender.com" />
        <link rel="preconnect" href="https://warpfix-api.onrender.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icons/icon-16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
