import { Card } from "@rainmachine/ui";
import { MfaVerifyForm } from "./MfaVerifyForm";
import { Suspense } from "react";

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-cyan text-xl uppercase tracking-widest">
            VERIFY IDENTITY
          </h1>
          <p className="font-body text-text-muted text-sm mt-1">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        <Card variant="elevated" padding="lg">
          <Suspense fallback={null}>
            <MfaVerifyForm />
          </Suspense>
        </Card>
        <div className="text-center mt-4">
          <a
            href="/login"
            className="font-body text-xs text-text-muted hover:text-cyan transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
