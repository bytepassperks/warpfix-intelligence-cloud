import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
