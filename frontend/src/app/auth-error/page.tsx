"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "An unknown error occurred";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p>Loading...</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
