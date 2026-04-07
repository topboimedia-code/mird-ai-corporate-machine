"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, AlertBanner } from "@rainmachine/ui";
import { ceoLoginAction } from "./actions";

export function CeoLoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(ceoLoginAction, null);

  useEffect(() => {
    if (state?.requiresMfa && state.challengeId) {
      router.push(`/login/verify?challengeId=${state.challengeId}`);
    }
  }, [state, router]);

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
        placeholder="ceo@rainmachine.io"
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
    </form>
  );
}
