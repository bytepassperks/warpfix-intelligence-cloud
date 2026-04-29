import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "WarpFix — Autonomous CI Repair Agent",
  description: "Detect CI failures, generate safe patches, validate in sandboxes, and open PRs automatically. Terminal-native intelligence for your pipeline.",
  keywords: ["CI repair", "automated fixes", "DevOps", "GitHub", "CI/CD", "code review"],
};

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
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
