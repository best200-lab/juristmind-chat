// supabase/functions/paystack_webhook/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.39.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const PAYSTACK_WEBHOOK_SECRET = Deno.env.get("PAYSTACK_WEBHOOK_SECRET") ?? "";

const encoder = new TextEncoder();

/** Convert a hex string to Uint8Array (used for the signature) */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Verify Paystack HMAC‑SHA‑512 signature */
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(PAYSTACK_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    hexToUint8Array(signatureHeader),
    encoder.encode(rawBody),
  );
  return valid;
}

/** Resolve a Supabase user ID from metadata or email */
async function resolveUserId(
  metaUserId?: string,
  email?: string,
): Promise<string | null> {
  if (metaUserId) {
    const { data, error } = await supabase
      .from("auth.users")
      .select("id")
      .eq("id", metaUserId)
      .single();
    if (!error && data) return data.id as string;
  }
  if (email) {
    const { data, error } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .single();
    if (!error && data) return data.id as string;
  }
  return null;
}

/** Compute expiry date based on the plan */
function computeExpiry(plan: string, now: Date): Date {
  const expiry = new Date(now);
  if (plan === "daily") expiry.setDate(now.getDate() + 1);
  else if (plan === "monthly") expiry.setMonth(now.getMonth() + 1);
  else if (plan === "yearly") expiry.setFullYear(now.getFullYear() + 1);
  return expiry;
}

/** Edge Function entry point */
Deno.serve(async (req: Request) => {
  try {
    // ---- Verify signature -------------------------------------------------
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const rawBody = await req.text();
    if (!(await verifySignature(rawBody, signature))) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- Parse payload ----------------------------------------------------
    const payload = JSON.parse(rawBody);
    if (payload.event !== "charge.success") {
      return new Response(
        JSON.stringify({ ok: true, message: "Event ignored" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const { reference, amount, customer, metadata } = payload.data;
    const email = customer?.email;
    const plan = metadata?.plan;
    const metaUserId = metadata?.user_id;

    // ---- Validate plan ----------------------------------------------------
    if (!plan || !["daily", "monthly", "yearly"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: `Invalid or missing plan: ${plan}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- Resolve user ------------------------------------------------------
    const userId = await resolveUserId(metaUserId, email);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- Compute dates -----------------------------------------------------
    const now = new Date();
    const expiresAt = computeExpiry(plan, now);

    // ---- Store / upsert subscription ---------------------------------------
    const { error: dbError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount: amount / 100, // kobo → NGN
        paystack_reference: reference,
        // If you enable column encryption, replace the plain reference with the
        // result of: `await supabase.rpc('pgp_sym_encrypt', { data: reference, psw: 'your-secret-key' })`
      },
      { onConflict: "paystack_reference" },
    );

    if (dbError) {
      console.error("Upsert error:", dbError);
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Subscription stored" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Webhook handler exception:", e);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});