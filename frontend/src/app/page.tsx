import Link from "next/link";
import { TerminalDemo } from "@/components/terminal-demo";
import { FeatureGrid } from "@/components/feature-grid";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg">WarpFix</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/api/auth/github"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/api/auth/github"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-6">
            Warp Terminal Native
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your CI Never
            <br />
            <span className="text-primary">Stays Broken</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            WarpFix detects CI failures, generates safe patches, validates them in sandboxes,
            and opens pull requests — all from a single terminal command.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/api/auth/github"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-lg"
            >
              Start Fixing for Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors text-lg"
            >
              See How It Works
            </a>
          </div>
          <TerminalDemo />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Keep CI Green
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              CodeRabbit-level intelligence meets Cursor-style context awareness,
              all running inside your Warp terminal.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How WarpFix Works</h2>
            <p className="text-muted-foreground text-lg">From failure to fix in seconds</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Detect", desc: "WarpFix monitors your CI pipeline and instantly detects failures via GitHub webhooks." },
              { step: "02", title: "Analyze & Patch", desc: "Multi-agent pipeline parses logs, classifies errors, checks fingerprint database, and generates a safe patch." },
              { step: "03", title: "Validate & Ship", desc: "Patch is validated in an isolated sandbox, scored for confidence, and a PR is opened automatically." },
            ].map((item) => (
              <div key={item.step} className="relative p-6 bg-card rounded-xl border border-border">
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">vs. The Competition</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-4 text-muted-foreground font-medium">Feature</th>
                  <th className="py-4 px-4 text-primary font-bold">WarpFix</th>
                  <th className="py-4 px-4 text-muted-foreground font-medium">CodeRabbit</th>
                  <th className="py-4 px-4 text-muted-foreground font-medium">Cursor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["CI failure auto-repair", true, false, false],
                  ["PR summaries & review", true, true, false],
                  ["Sandbox validation", true, false, false],
                  ["Fingerprint learning", true, false, false],
                  ["Dependency radar", true, false, false],
                  ["Terminal-first UX", true, false, true],
                  ["Codebase context", true, true, true],
                  ["Multi-file patches", true, true, true],
                ].map(([feature, wf, cr, cu], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 px-4">{feature as string}</td>
                    <td className="py-3 px-4">{wf ? <span className="text-success">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                    <td className="py-3 px-4">{cr ? <span className="text-success">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                    <td className="py-3 px-4">{cu ? <span className="text-success">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Fingerprint Intelligence */}
      <section className="py-20 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Repair Fingerprint Intelligence</h2>
              <p className="text-muted-foreground mb-6">
                Every error is hashed into a unique fingerprint. When the same error pattern
                appears again, WarpFix instantly reuses the proven fix — turning minutes into milliseconds.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Error patterns normalized and hashed",
                  "Fixes stored with confidence scores",
                  "Org-wide shared repair memory",
                  "Improves accuracy over time",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 font-mono text-sm">
              <div className="text-muted-foreground mb-2">fingerprint.hash</div>
              <div className="text-primary mb-4">a3f8c2d1e5b74910</div>
              <div className="text-muted-foreground mb-2">times_matched</div>
              <div className="text-success mb-4">47</div>
              <div className="text-muted-foreground mb-2">resolution_confidence</div>
              <div className="text-warning">92/100</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Validation */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Sandbox Validation Pipeline</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every patch runs through an isolated validation environment before it reaches your codebase.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Clone Repo", "Apply Patch", "Install Deps", "Run Tests", "Run Build", "Run Lint", "Score Confidence"].map(
              (step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-card border border-border rounded-lg text-sm">
                    {step}
                  </div>
                  {i < 6 && <span className="text-muted-foreground">&rarr;</span>}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Dependency Radar */}
      <section className="py-20 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                <span className="text-sm font-medium text-danger">Breaking Change Detected</span>
              </div>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span>react</span>
                  <span className="text-warning">18.2.0 &rarr; 19.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>next</span>
                  <span className="text-warning">14.1.0 &rarr; 15.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>typescript</span>
                  <span className="text-success">5.3.0 &rarr; 5.4.0</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Dependency Radar</h2>
              <p className="text-muted-foreground mb-6">
                WarpFix monitors the npm ecosystem for breaking releases, deprecated packages,
                and version conflicts — alerting you before they break your CI.
              </p>
              <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-mono">
                /predict-failure
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border">
        <PricingSection />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-muted/30 border-t border-border">
        <FAQSection />
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Fix CI Forever?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Install the Warp extension and start repairing CI failures in seconds.
          </p>
          <Link
            href="/api/auth/github"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:bg-primary/90 transition-colors"
          >
            Get Started with GitHub
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <span>WarpFix Intelligence Cloud</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/bytepassperks/warpfix-intelligence-cloud" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
