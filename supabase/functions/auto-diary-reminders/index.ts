// supabase/functions/auto-diary-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Initialize Supabase Admin Client (Service Role is required to access auth.users)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 2. Find events starting in the next 20 minutes that haven't been notified
    // We look 20 mins ahead to be safe since the cron runs every 10 mins
    const now = new Date();
    const twentyMinsLater = new Date(now.getTime() + 20 * 60000);

    const { data: events, error: eventError } = await supabase
      .from("diary_events")
      .select("id, title, event_date, entry_time, user_id")
      .eq("reminder_sent", false)
      .gte("event_date", now.toISOString()) // Event is in the future
      .lte("event_date", twentyMinsLater.toISOString()); // But soon

    if (eventError) throw eventError;

    console.log(`Found ${events?.length || 0} events to notify.`);

    const notifications = [];

    // 3. Loop through events and send emails
    for (const event of events || []) {
      // Get User Email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(event.user_id);
      
      if (userError || !user?.email) {
        console.error(`User not found for event ${event.id}`);
        continue;
      }

      // Combine Date/Time for display
      const displayTime = `${new Date(event.event_date).toDateString()} at ${event.entry_time}`;

      // Send Email via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Jurist Mind <reminders@juristmind.com>", // UPDATE THIS to your verified domain
          to: [user.email],
          subject: `🔔 Reminder: ${event.title} is starting soon`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Upcoming Event Reminder</h2>
              <p>Hello,</p>
              <p>This is a reminder for your scheduled event:</p>
              <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px;">${event.title}</h3>
                <p style="margin: 0;"><strong>Time:</strong> ${displayTime}</p>
              </div>
              <p>Login to <a href="https://juristmind.com/diary">Jurist Mind</a> to view details.</p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        notifications.push(event.id);
      } else {
        console.error(`Failed to send email for event ${event.id}:`, await res.text());
      }
    }

    // 4. Mark these events as "reminder_sent = true" so we don't email them again
    if (notifications.length > 0) {
      await supabase
        .from("diary_events")
        .update({ reminder_sent: true })
        .in("id", notifications);
    }

    return new Response(JSON.stringify({ success: true, notified: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
