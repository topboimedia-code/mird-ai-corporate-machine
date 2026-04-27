"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function ceoLoginAction(
  _prevState: {
    error?: string;
    requiresMfa?: boolean;
    challengeId?: string;
  } | null,
  formData: FormData,
): Promise<{ error?: string; requiresMfa?: boolean; challengeId?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid credentials." };
  }

  type UserRow = { role: "owner" | "agent" | "ceo" };
  const { data: userRows } = (await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .limit(1)) as { data: UserRow[] | null; error: unknown };

  const userRecord = userRows?.[0];
  if (!userRecord || userRecord.role !== "ceo") {
    await supabase.auth.signOut();
    return { error: "Access denied." };
  }

  // Get enrolled TOTP factors
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactor = factorsData?.totp?.[0];

  // TODO: Re-enable MFA enforcement after initial CEO account setup
  // Temporarily allow login without MFA so CEO can enroll TOTP
  if (!totpFactor) {
    redirect("/");
  }

  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.challenge(
    { factorId: totpFactor.id },
  );

  if (mfaError ?? !mfaData) {
    return { error: "MFA challenge failed. Please try again." };
  }

  return {
    requiresMfa: true,
    challengeId: mfaData?.id,
  };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
