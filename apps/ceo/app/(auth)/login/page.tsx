import { Card } from "@rainmachine/ui";
import { CeoLoginForm } from "./CeoLoginForm";

export default function CeoLoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-cyan text-xl uppercase tracking-widest">
            CEO ACCESS
          </h1>
          <p className="font-body text-text-muted text-sm mt-1">
            TOTP verification required
          </p>
        </div>
        <Card variant="elevated" padding="lg">
          <CeoLoginForm />
        </Card>
      </div>
    </main>
  );
}
