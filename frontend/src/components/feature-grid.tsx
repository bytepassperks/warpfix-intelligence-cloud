const FEATURES = [
  {
    title: "CI Failure Detection",
    description: "Automatic detection of workflow failures via GitHub webhooks. Instant log parsing and error extraction.",
    icon: "🔍",
  },
  {
    title: "Multi-Agent Pipeline",
    description: "Six specialized agents work in sequence: log parser, classifier, patch generator, sandbox validator, confidence engine, PR creator.",
    icon: "🧠",
  },
  {
    title: "Fingerprint Learning",
    description: "Every error pattern is fingerprinted. When the same error recurs, the proven fix is instantly reused.",
    icon: "🔑",
  },
  {
    title: "Sandbox Validation",
    description: "Patches are tested in isolated Docker containers — clone, apply, install, test, build, lint — before any PR is opened.",
    icon: "🛡️",
  },
  {
    title: "Confidence Scoring",
    description: "Each repair gets a 0-100 confidence score based on sandbox results, patch size, fingerprint history, and classification.",
    icon: "📊",
  },
  {
    title: "Dependency Radar",
    description: "Monitors npm ecosystem for breaking releases, deprecated packages, and version conflicts before they hit your CI.",
    icon: "📡",
  },
  {
    title: "PR Summaries & Review",
    description: "CodeRabbit-level PR descriptions with error classification, risk analysis, patch justification, and confidence breakdown.",
    icon: "📝",
  },
  {
    title: "Context-Aware Repairs",
    description: "Cursor-style repo reasoning — understands your language, package manager, runtime, and dependency tree.",
    icon: "🎯",
  },
  {
    title: "CLI-First UX",
    description: "Run warpfix doctor, warpfix fix-ci, warpfix fix-tests from any terminal. Zero-dependency Node.js CLI.",
    icon: "⌨️",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {FEATURES.map((feature, i) => (
        <div
          key={i}
          className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
        >
          <div className="text-2xl mb-3">{feature.icon}</div>
          <h3 className="font-semibold mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
