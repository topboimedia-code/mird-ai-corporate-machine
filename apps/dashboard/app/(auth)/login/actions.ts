"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@rainmachine/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please verify your email before logging in." };
    }
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Invalid email or password." };
    }
    if (error.message.includes("Too many requests")) {
      return { error: "Too many login attempts. Please wait 15 minutes." };
    }
    return { error: "Login failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
