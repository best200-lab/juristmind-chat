import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { action, amount, payment_type, callback_url } = await req.json();

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.log(`Payment action: ${action}`);

    switch (action) {
      case 'initialize': {
        // Get user profile for email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();

        const reference = `${payment_type}_${user.id}_${Date.now()}`;
        
        // Initialize Paystack payment
        const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: profile?.email || user.email,
            amount: amount * 100, // Convert to kobo
            reference,
            callback_url: callback_url || `${new URL(req.url).origin}/payment-success`,
            metadata: {
              user_id: user.id,
              payment_type,
            },
          }),
        });

        const paystackData = await paystackResponse.json();
        
        if (!paystackData.status) {
          throw new Error(paystackData.message || 'Payment initialization failed');
        }

        // Store payment record
        const { data: payment, error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            user_id: user.id,
            reference,
            amount,
            payment_type,
            paystack_reference: paystackData.data.reference,
            status: 'pending',
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        return new Response(JSON.stringify({
          success: true,
          authorization_url: paystackData.data.authorization_url,
          reference: paystackData.data.reference,
          payment_id: payment.id,
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'verify': {
        const { reference } = await req.json();
        
        // Verify payment with Paystack
        const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
          },
        });

        const paystackData = await paystackResponse.json();
        
        if (!paystackData.status) {
          throw new Error('Payment verification failed');
        }

        const transaction = paystackData.data;
        
        // Update payment status
        const { data: payment, error: updateError } = await supabaseClient
          .from('payments')
          .update({ 
            status: transaction.status === 'success' ? 'completed' : 'failed'
          })
          .eq('paystack_reference', reference)
          .select()
          .single();

        if (updateError) throw updateError;

        // If payment successful and it's for premium, update user credits
        if (transaction.status === 'success' && payment.payment_type === 'premium') {
          const premiumExpiry = new Date();
          premiumExpiry.setMonth(premiumExpiry.getMonth() + 1); // 1 month premium

          await supabaseClient
            .from('user_credits')
            .upsert({
              user_id: user.id,
              is_premium: true,
              premium_expires_at: premiumExpiry.toISOString(),
              credits_remaining: 999, // Unlimited for premium
            }, {
              onConflict: 'user_id'
            });
        }

        return new Response(JSON.stringify({
          success: true,
          payment_status: transaction.status,
          transaction,
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in paystack-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});