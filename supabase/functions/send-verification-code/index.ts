import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email }: SendCodeRequest = await req.json();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete any existing codes for this email
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', email);

    // Insert new verification code
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw insertError;
    }

    // Send email with verification code
    const emailResponse = await resend.emails.send({
      from: "JURIST MIND <onboarding@resend.dev>",
      to: [email],
      subject: "Your JURIST MIND Verification Code",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">JURIST MIND</h1>
          <h2 style="color: #666; text-align: center;">Email Verification</h2>
          
          <p>Hello,</p>
          
          <p>Thank you for signing up with JURIST MIND. Please use the following verification code to complete your registration:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          
          <p>This verification code will expire in 10 minutes for security purposes.</p>
          
          <p>If you didn't request this verification code, please ignore this email.</p>
          
          <p>Best regards,<br>The JURIST MIND Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent to your email"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);