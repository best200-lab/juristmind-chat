import { createClient } from "npm:@supabase/supabase-js@2.39.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const PAYSTACK_WEBHOOK_SECRET = Deno.env.get("PAYSTACK_WEBHOOK_SECRET") ?? "";
const encoder = new TextEncoder();

// --- 1. Verify Request is from Paystack ---
async function verifySignature(rawBody: string, signatureHeader: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(PAYSTACK_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["verify"],
  );
  const bytes = new Uint8Array(signatureHeader.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(signatureHeader.substring(i * 2, i * 2 + 2), 16);
  }
  return await crypto.subtle.verify("HMAC", key, bytes, encoder.encode(rawBody));
}

Deno.serve(async (req: Request) => {
  try {
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const rawBody = await req.text();
    
    // Security Check
    if (!(await verifySignature(rawBody, signature))) {
      return new Response("Invalid Signature", { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    // Only process successful payments
    if (payload.event === "charge.success") {
      const { reference, amount, metadata } = payload.data;
      const userId = metadata?.user_id;
      const planKey = metadata?.plan_key; // Will be "student_monthly"

      if (userId && planKey) {
        // 1. Get Plan Duration from Database (e.g., 30 days)
        const { data: plan } = await supabase
          .from("plans")
          .select("duration_days")
          .eq("plan_key", planKey)
          .single();

        const duration = plan?.duration_days || 30;
        
        // 2. Calculate Expiry
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + duration);

        // 3. Upgrade the User
        await supabase.from("profiles").update({
          plan_key: planKey,
          plan_expires_at: expiry.toISOString()
        }).eq("id", userId);

        // 4. Record the Subscription
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan: planKey,
          status: "active",
          amount: amount / 100,
          paystack_reference: reference,
          expires_at: expiry.toISOString(),
          started_at: new Date().toISOString()
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
