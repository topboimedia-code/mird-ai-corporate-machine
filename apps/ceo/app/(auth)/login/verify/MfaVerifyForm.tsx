"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, AlertBanner } from "@rainmachine/ui";
import { verifyMfaAction } from "./actions";

export function MfaVerifyForm() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challengeId") ?? "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("challengeId", challengeId);
    formData.set("code", code);
    const result = await verifyMfaAction(null, formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="mfa-verify-form"
      className="flex flex-col gap-4"
    >
      {error && (
        <AlertBanner type="error" title={error} data-testid="mfa-error" />
      )}
      <div className="flex gap-2 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            className="w-10 h-12 text-center rounded border border-border bg-surface text-text font-mono text-lg focus:outline-none focus:ring-1 focus:ring-cyan focus:border-cyan"
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            data-testid={`digit-${i}`}
          />
        ))}
      </div>
      <Button
        type="submit"
        loading={isPending}
        fullWidth
        data-testid="verify-button"
      >
        VERIFY
      </Button>
    </form>
  );
}
