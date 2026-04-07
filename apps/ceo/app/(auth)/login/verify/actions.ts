"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const verifySchema = z.object({
  challengeId: z.string().min(1),
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be digits only"),
});

export async function verifyMfaAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = verifySchema.safeParse({
    challengeId: formData.get("challengeId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: "Invalid verification code format." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactor = factorsData?.totp?.[0];

  if (!totpFactor) {
    return { error: "MFA factor not found." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId: totpFactor.id,
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });

  if (error) {
    if (error.message.includes("Invalid TOTP code")) {
      return { error: "Invalid code. Please try again." };
    }
    if (error.message.includes("expired")) {
      return {
        error: "Code expired. Please go back and log in again.",
      };
    }
    return { error: "Verification failed." };
  }

  redirect("/");
}
