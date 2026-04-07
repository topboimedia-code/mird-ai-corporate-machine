import { Card } from "@rainmachine/ui";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-cyan text-xl uppercase tracking-widest">
            RAINMACHINE
          </h1>
          <p className="font-body text-text-muted text-sm mt-1">
            AI-Powered Client Acquisition
          </p>
        </div>
        <Card variant="elevated" padding="lg">
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
