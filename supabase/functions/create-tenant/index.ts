// Supabase Edge Function: create-tenant
// Runtime: Deno — uses esm.sh imports, not Node.js
// Creates auth user + tenant row + users row atomically (saga with rollback)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateTenantPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantSlug: string;
  plan?: string;
}

serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: CreateTenantPayload;
  try {
    payload = (await req.json()) as CreateTenantPayload;
  } catch {
    return new Response(
      JSON.stringify({ success: false, errorCode: "VALIDATION_ERROR" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { email, password, firstName, lastName, tenantName, tenantSlug, plan } =
    payload;

  if (!email || !password || !firstName || !lastName || !tenantName || !tenantSlug) {
    return new Response(
      JSON.stringify({ success: false, errorCode: "VALIDATION_ERROR" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey!,
  );

  // Step 1: Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return new Response(
        JSON.stringify({ success: false, errorCode: "EMAIL_ALREADY_EXISTS" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const userId = authData.user.id;

  // Step 2: Create tenant row
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: tenantName,
      slug: tenantSlug,
      plan: plan ?? "starter",
      status: "provisioning",
    })
    .select("id")
    .single();

  if (tenantError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(userId);
    if (tenantError.code === "23505") {
      return new Response(
        JSON.stringify({ success: false, errorCode: "SLUG_ALREADY_EXISTS" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const tenantId = tenantData.id as string;

  // Step 3: Create users row linking auth user to tenant
  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    tenant_id: tenantId,
    role: "owner",
    first_name: firstName,
    last_name: lastName,
  });

  if (userError) {
    // Rollback: delete tenant and auth user
    await supabase.from("tenants").delete().eq("id", tenantId);
    await supabase.auth.admin.deleteUser(userId);
    return new Response(
      JSON.stringify({ success: false, errorCode: "INTERNAL_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, tenantId, userId }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
});
