// supabase/functions/increment_usage/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.4";

// Use the Service Role key – it bypasses RLS when we call RPCs.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const FREE_QUOTA = 5;

/** Verify the incoming request carries a valid Supabase JWT and return the user id. */
async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!authHeader) return null;
  const { data: { user }, error } = await supabase.auth.getUser(authHeader);
  if (error || !user) return null;
  return user.id;
}

/** Compute the ISO date (YYYY‑MM‑DD) for "today" – the format expected by the RPC. */
function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

Deno.serve(async (req: Request) => {
  try {
    // ---- Authenticate ---------------------------------------------------
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ allowed: false, error: "Unauthenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- Check for an active paid subscription ------------------------
    const { data: subData, error: subError } = await supabase.rpc(
      "get_subscription",
      { p_user_id: userId },
    );
    if (!subError && subData && subData.status === "active" && new Date(subData.expires_at) > new Date()) {
      // Paid users have unlimited usage.
      return new Response(
        JSON.stringify({ allowed: true, used: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- Free‑tier usage: increment and enforce quota -----------------
    const { data: newCount, error: incError } = await supabase.rpc(
      "increment_usage",
      { p_user_id: userId, p_date: todayDate() },
    );
    if (incError) {
      console.error("increment_usage RPC error:", incError);
      return new Response(
        JSON.stringify({ allowed: false, error: `DB error: ${incError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const allowed = (newCount as number) <= FREE_QUOTA;
    return new Response(
      JSON.stringify({ allowed, used: newCount }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("increment_usage function exception:", e);
    return new Response(
      JSON.stringify({ allowed: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});