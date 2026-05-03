import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Developer Tools — CI/CD Utilities | WarpFix",
  description:
    "Free online tools for developers: CI error decoder, GitHub Actions workflow generator, YAML validator, cost calculator, and more. No signup required.",
  keywords: [
    "free developer tools",
    "CI/CD tools",
    "GitHub Actions generator",
    "CI error decoder",
    "YAML validator",
    "CI cost calculator",
    "flaky test detector",
    "cron expression builder",
    "dockerfile linter",
    "build time estimator",
  ],
  openGraph: {
    title: "Free Developer Tools | WarpFix",
    description:
      "Free CI/CD tools for developers. Decode errors, generate workflows, validate YAML, calculate costs — all in your browser.",
    url: "https://warpfix.org/tools",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
