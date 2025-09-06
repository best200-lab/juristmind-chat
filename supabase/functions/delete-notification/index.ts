import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow DELETE
  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!id) {
      return new Response("Missing id", { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Admin guard (same as above)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user?.email || user.email !== "ogunseun7@gmail.com") {
      return new Response("Forbidden", { 
        status: 403,
        headers: corsHeaders
      });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in delete-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});