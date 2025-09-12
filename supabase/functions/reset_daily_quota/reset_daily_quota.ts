// supabase/functions/reset_daily_quota.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async () => {
  // Reset all counters to 0 for the new day
  const { error } = await supabase
    .from("public.usage_daily")
    .delete()
    .lt("used_at", new Date().toISOString().split("T")[0]); // delete rows older than today

  // (Alternatively, you could `UPDATE ... SET count = 0` if you want to keep history.)

  if (error) {
    console.error("reset_daily_quota error:", error);
    return new Response(JSON.stringify({ error: "failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }));
});