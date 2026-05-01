"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Terminal, FolderGit2, Eye, ArrowRight, X, Check } from "lucide-react";

const STEPS = [
  {
    icon: GitBranch,
    title: "Connect GitHub",
    description: "Install the WarpFix GitHub App to let us access your repositories and CI workflows.",
    cta: "Install GitHub App",
    href: "https://github.com/apps/warpfix/installations/new",
  },
  {
    icon: FolderGit2,
    title: "Select a repository",
    description: "Choose a repository with an active CI pipeline. WarpFix monitors GitHub Actions workflows.",
    cta: "Go to Repositories",
    href: "/dashboard/repositories",
  },
  {
    icon: Terminal,
    title: "Run /fix-ci",
    description: "In your Warp terminal, type /fix-ci to trigger your first repair. Or wait for CI to fail naturally.",
    cta: "View Commands",
    href: "#",
  },
  {
    icon: Eye,
    title: "Watch your first repair",
    description: "WarpFix analyzes the failure, generates a patch, validates it, and opens a PR — all automatically.",
    cta: "View Dashboard",
    href: "/dashboard",
  },
];

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl border border-[var(--border-default)] w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="text-[13px] text-[var(--text-tertiary)]">
              Step {step + 1} of {STEPS.length}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Close onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 px-6 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-[var(--brand)]" : "bg-[var(--bg-tertiary)]"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-muted)] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{current.title}</h2>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
                {current.description}
              </p>

              <div className="flex items-center justify-between">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-hover)] transition-colors"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-hover)] transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Get Started
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
