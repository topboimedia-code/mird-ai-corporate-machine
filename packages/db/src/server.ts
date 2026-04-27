import {
  createServerClient as _createServerClient,
  createBrowserClient as _createBrowserClient,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

export type { Database };

/**
 * CookieAdapter — minimal interface matching Next.js ReadonlyRequestCookies.
 * Pass `await cookies()` from `next/headers` directly.
 */
export interface CookieAdapter {
  getAll: () => Array<{ name: string; value: string }>;
  set?: (name: string, value: string, options: Record<string, unknown>) => void;
}

export function createServerClient(cookieStore: CookieAdapter) {
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (cookieStore.set) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set!(name, value, options as Record<string, unknown>);
            });
          }
        },
      },
    },
  );
}

export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function createAdminClient() {
  // Admin client bypasses RLS — server-only, never import in client components
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export const createServiceRoleClient = createAdminClient;
