"use client";

import { useActionState } from "react";
import { Button, Input, AlertBanner } from "@rainmachine/ui";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form
      action={formAction}
      data-testid="login-form"
      className="flex flex-col gap-4"
    >
      {state?.error && (
        <AlertBanner
          type="error"
          title={state.error}
          data-testid="login-error"
        />
      )}
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        fullWidth
        data-testid="email-input"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        fullWidth
        data-testid="password-input"
      />
      <Button
        type="submit"
        loading={isPending}
        fullWidth
        className="mt-2"
        data-testid="login-button"
      >
        LOG IN
      </Button>
      <p className="text-center font-body text-xs text-text-muted">
        <span className="cursor-pointer hover:text-cyan transition-colors">
          Forgot password?
        </span>
      </p>
    </form>
  );
}
